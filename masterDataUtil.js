var masterDataUtil = function() {
    var MASTERDATA_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwlCQu7Q3q50JhlH6uASDgFEW2lMxgGG8cRujl1CONAY_c6ExpV9TckVvapE4zQBIi0/exec";
    var sheetId = '1w3ijJ8cAoJRLDgezX5hX6mGyz7BTGYhX2maFHOwSbLU';
    var base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
    var sheetName = 'Sheet1';
    var query = encodeURIComponent('Select *')
    var url = `${base}&sheet=${sheetName}&tq=${query}`

    var SEARCH_COL = "Email";
    var MASTER_DATA = [];
    var EXISTING_DATA_INDEX = 0;

    function loadData(enteredSearchText, isSendMail)
    {
        MASTER_DATA=[];
        EXISTING_DATA_INDEX = 0;

        isMasterDataExists = false;

        return new Promise((resolve, reject) => {

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

            jsonData.table.rows.forEach((rowData) => {
                const row = {};
                colz.forEach((ele, ind) => {
                    row[ele] = (rowData.c[ind] != null) ? rowData.c[ind].v : '';
                })
                MASTER_DATA.push(row);
            });

            var foundEntry = MASTER_DATA.find(el => el[SEARCH_COL] === enteredSearchText);
            EXISTING_DATA_INDEX = MASTER_DATA.findIndex(el => el[SEARCH_COL] === enteredSearchText) + 1;

            const obj = {};

            for (const key of colz) {                
                obj[key] = (key === SEARCH_COL) ? enteredSearchText : "";
            }

            var mymodal = $('#myModal');
            if(!isSendMail)
            {
                var tblContent = modalBody(foundEntry || obj);
                mymodal.find('.modal-body').html(tblContent);
                mymodal.modal('show');
            }else{
                if(!foundEntry){
                    var tblContent = modalBody(obj);
                    mymodal.find('.modal-body').html(tblContent);
                    mymodal.modal('show');
                    isMasterDataExists = false; 
                }else{
                    isMasterDataExists = true;
                }
            }         
            resolve(isMasterDataExists);

        })
        .catch(err => {
          console.log('Error occured while populating config data from google spreadsheet', err);
          reject(true);
        })

    });
        
    }

    function saveMasterData(formData){

        var data = formData;
        var url =  MASTERDATA_SCRIPT_URL; 
        data.rowIndex = EXISTING_DATA_INDEX;

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        // xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
              console.log('Master data is saved into spreadsheet!')
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

    function modalBody(array)
    {
        var table = document.createElement('table');        

        for (const objProp of Object.entries(array)) {
            var tr = document.createElement('tr');
            var td1 = document.createElement('td');
            var td2 = document.createElement('td');

            var labelControl = document.createTextNode(objProp[0]);
       
            var textControl = document.createElement("input");
            textControl.type = "text";
            textControl.id = objProp[0];
            textControl.value = objProp[1];
            textControl.className = "css-class-name";

            td1.appendChild(labelControl);
            td2.appendChild(textControl);    
    
            tr.appendChild(td1);
            tr.appendChild(td2);
            
            table.appendChild(tr);
        }

        return table;
    }

    return function(){
        return { LoadData: loadData, SaveMasterData: saveMasterData }
    }

}();
