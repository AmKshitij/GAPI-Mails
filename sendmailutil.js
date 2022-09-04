var mailUtil = function() {
  
  // Script level variables to form Script URL of google spredsheet - Config Data
  var CONFIG_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxc9363GmUYxQMU-35Wpf6myHVIEbUPP0Dc-Z06tFFPShMQ4jnx2s6l3pNoBfG4JNSa/exec';
  var sheetId = '1oVXpShqB2GoZD52VM-q-TcnSAlvHAnil-pONy9XlG80';
  var base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
  var sheetName = 'scriptUrls';   // sheetname inside 'ConfigData' spreadsheet
  var query = encodeURIComponent('Select *')
  var url = `${base}&sheet=${sheetName}&tq=${query}`

  var CONFIG_DATA = [];
  var DAILY_QUOTA_THRESHOLD = 10;
  var SCRIPT_URL_ROW_INDEX = 0;
  var IS_EMAILQUOTA_EXCEEDED = false;
  var ACTIVE_SCRIPT_URL = '';

  // This function is used to load data from Google spreadsheet - "config data"
  // initialize needs to be executed on page load/script load so that config data is populated
  // before caling sendMail function

  function initialize() {
      CONFIG_DATA = [];
      fetch(url)
          .then(res => res.text())
          .then(rep => {
              //Remove additional text and extract only JSON:
              const jsonData = JSON.parse(rep.substring(47).slice(0, -2));
  
              const colz = [];
              //Extract column labels
              
              jsonData.table.cols.forEach((heading) => {
                  if (heading.label) {
                      let column = heading.label;
                      colz.push(column);
                  }
              });

              //extract row data:
              jsonData.table.rows.forEach((rowData) => {
                  const row = {};
                  colz.forEach((ele, ind) => {
                      row[ele] = (rowData.c[ind] != null) ? rowData.c[ind].v : '';
                  })
                  CONFIG_DATA.push(row);
              });

              console.log('config data loaded', CONFIG_DATA);
              assignInitialScriptAction(CONFIG_DATA);
          })
          .catch(err => {
            console.log('Error occured while populating config data from google spreadsheet', err);
          })
  }

 
  // This function is used to send mail using Google APIs
  // It make XHR call to Google script url for sending mails
  // parameters -
  // data: javascript object containing mail body
  // Example data obj-
  // var data = {name:"Test d`souza 'send' mail from obj", message: "Description text goes here", email:"a@bb.com", subject:"ff", cc:"sender@gmail.com"}
  // successCallback: callback function that needs to be executed after successful execution
  // failureCallBack: callback function that needs to be executed on failure case
  function sendMail(data, successCallback, failureCallBack){

        var url = ACTIVE_SCRIPT_URL;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        // xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {

              var reQuota = JSON.parse(xhr.response);
              UpdateEmailQuotaRemaining(reQuota.EmailQuotaRemaining);

              successCallback();
            }
        };

        xhr.onerror = function(error){
          failureCallBack(error);
        }

        xhr.onloadend = function() {
          if(xhr.status == 404) 
              failureCallBack(new Error(url + ' replied 404'));
        }

        // url encode form data for sending as post data
        var encoded = Object.keys(data).map(function(k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
        }).join('&');
        xhr.send(encoded);

  }
    
  // This function is used to update Remaining Email Quota in Google spreadsheet - "Config Data" 
  // It make XHR call to update google spreadsheet
  // This function is for intenal calling i.e. from sendMail and not for external use
  function UpdateEmailQuotaRemaining(remainingQuota){
        var formData = {};
        formData.formRowIndex = SCRIPT_URL_ROW_INDEX;
        if(CONFIG_DATA[SCRIPT_URL_ROW_INDEX-1])
          formData.formDailyQuota = remainingQuota;

        var data = formData;

        var url = CONFIG_SCRIPT_URL; 

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        // xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
              console.log('Remaining-Email-Quota updated in Config spreadsheet!')
            }
        };

        xhr.onerror = function(error){
          console.log('Error!', error);
        }

        xhr.onloadend = function() {
          if(xhr.status == 404) 
              console.log(new Error(url + ' replied 404'));
        }

        // url encode form data for sending as post data
        var encoded = Object.keys(data).map(function(k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
        }).join('&');
        xhr.send(encoded);
  }

  // This function is used to initialize global level variables
  // This function is for intenal calling i.e. from initialize and not for external use
  function assignInitialScriptAction(configSheetData){
    //var frm = document.getElementById('frmContactUs') || null;

    DAILY_QUOTA_THRESHOLD = configSheetData[0].Threshold;
    console.log('Thrshold', DAILY_QUOTA_THRESHOLD);
      configSheetData.every(function(sheetRow, index) {
        if(sheetRow.RemainingDailyQuota > DAILY_QUOTA_THRESHOLD)
        {
          ACTIVE_SCRIPT_URL = sheetRow.AppScriptURL;
          SCRIPT_URL_ROW_INDEX = (index+1);
          return false;
        }else{
          return true;
        }
      });

      if(SCRIPT_URL_ROW_INDEX === 0){
        ACTIVE_SCRIPT_URL = configSheetData[1].AppScriptURL;
        IS_EMAILQUOTA_EXCEEDED = true;
        console.log('Alert: ScriptURL not set!');
      }
    
    console.log('Form action URL set to:', ACTIVE_SCRIPT_URL);

  }

  return function(){
    return { Initialize: initialize, SendMail: sendMail }
  }
}();
