var masterDataUtil = function() {
    
    var MASTERDATA_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzRH7UQCkWLlxXBaHiFDd9tyDzivWpekQfOEqkwuo6c5i_TFZqCTJI807BUlxVRlnB6/exec";
    var sheetId = '1w3ijJ8cAoJRLDgezX5hX6mGyz7BTGYhX2maFHOwSbLU';
    var base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
    var dataSheetName = 'Sheet1';
    var configSheetName = 'Sheet3';
    var query = encodeURIComponent('Select *')
    var dataUrl = `${base}&sheet=${dataSheetName}&tq=${query}`
    var configUrl = `${base}&sheet=${configSheetName}&tq=${query}`

    var SEARCH_COLS = "Email;Phone";
    var MASTER_DATA = [];
    var FIELD_CONFIG_DATA = [];
    var EXISTING_DATA_INDEX = 0;

    function loadData(enteredSearchText)
    {
        MASTER_DATA=[];
        EXISTING_DATA_INDEX = 0;

        return new Promise((resolve, reject) => {

        fetch(dataUrl)
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
            
            var foundEntry = MASTER_DATA.find(el => { 
                    return (el[SEARCH_COLS.split(';')[0]].includes(enteredSearchText) ||
                                el[SEARCH_COLS.split(';')[1]].toString().includes(enteredSearchText))
                }
            );

            EXISTING_DATA_INDEX = MASTER_DATA.findIndex(el => { 
                return (el[SEARCH_COLS.split(';')[0]].includes(enteredSearchText) ||
                            el[SEARCH_COLS.split(';')[1]].toString().includes(enteredSearchText))
            }) + 1;

            const obj = {};
            
            colz.forEach((colname, index) => {
                obj[colname] = (colname === ((enteredSearchText.includes('@')) ?
                                SEARCH_COLS.split(';')[0] : SEARCH_COLS.split(';')[1])) ?
                                enteredSearchText : "";
            });

            resolve({ Exists : !!(foundEntry), ModalFields: (foundEntry || obj) });

        })
        .catch(err => {
          console.log('Error occured while populating config data from google spreadsheet', err);
          reject(true);
        })

    });
        
    }


    function loadFieldConfigInfo()
    {
        FIELD_CONFIG_DATA=[];

        return new Promise((resolve, reject) => {

        fetch(configUrl)
        .then(res => res.text())
        .then(rep => {
            //Remove additional text and extract only JSON:
            const jsonData = JSON.parse(rep.substring(47).slice(0, -2));
  
            const colz = [];
            //Extract column labels

            jsonData.table.rows.forEach((heading, index) => {
                heading.c.forEach(cel => {
                  try { var valeur = cel.f ? cel.f : cel.v }
                  catch (e) { var valeur = '' }
                  if (index == 0) { colz.push(valeur) }
                })
            })

            jsonData.table.rows.forEach((rowData) => {
                const row = {};
                colz.forEach((ele, ind) => {
                    row[ele] = (rowData.c[ind] != null) ? rowData.c[ind].v : '';
                })
                FIELD_CONFIG_DATA.push(row);
            });

            resolve({ FieldConfigData : FIELD_CONFIG_DATA.slice(1, FIELD_CONFIG_DATA.length) });

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
        return new Promise((resolve, reject) => {

            var xhr = new XMLHttpRequest();
            xhr.open('POST', url);

            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                console.log('Master data is saved into spreadsheet!');
                resolve(true);
                }
            };

            xhr.onerror = function(error){
            console.log('Error!', error);
            //debugger;
            reject(error);
            }

            xhr.onloadend = function() {
            if(xhr.status == 404) {
                console.log(new Error(url + ' replied 404'));
                reject('Script url Not found!')
            }
            }

            // url encode form data for sending as post data
            var encoded = Object.keys(data).map(function(k) {
                return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
            }).join('&');
            xhr.send(encoded);
        });
    }    

    return function(){
        return { LoadData: loadData, LoadFieldConfigInfo: loadFieldConfigInfo, SaveMasterData: saveMasterData }
    }

}();
