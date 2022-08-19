var masterDataUtil = function() {

    //var CONFIG_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyr368ryiTE_WjgPX_o2pYpY1_RhnZYL5aQ46uBjJjjXk0MxdIu9Cnw-_gLfsu-cDQ/exec';
    var sheetId = '1w3ijJ8cAoJRLDgezX5hX6mGyz7BTGYhX2maFHOwSbLU';
    var base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
    var sheetName = 'Sheet1';
    var query = encodeURIComponent('Select *')
    var url = `${base}&sheet=${sheetName}&tq=${query}`

    var MASTER_DATA = [];

    function loadData()
    {
        MASTER_DATA=[];

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

            console.log(MASTER_DATA);
            var tblContent = modalBody(MASTER_DATA);

            var mymodal = $('#myModal');
            //mymodal.find('.modal-body').text(tblContent);
            mymodal.find('.modal-body').html(tblContent);
            mymodal.modal('show');

        })
        .catch(err => {
          console.log('Error occured while populating config data from google spreadsheet', err);
        })

    }

    function modalBody(array)
    {
        var table = document.createElement('table');
        var tr = document.createElement('tr');
        var arrheader = ['Username', 'Email', 'Phone', 'GST'];


        for (var j = 0; j < arrheader.length; j++) {
        var th = document.createElement('th'); //column
        var text = document.createTextNode(arrheader[j]); //cell
        th.appendChild(text);
        tr.appendChild(th);
        }
        table.appendChild(tr);

        for (var i = 0; i < array.length; i++) {
        var tr = document.createElement('tr');

        var td1 = document.createElement('td');
        var td2 = document.createElement('td');
        var td3 = document.createElement('td');
        var td4 = document.createElement('td');

        var text1 = document.createTextNode(array[i].Username);
        var text2 = document.createTextNode(array[i].Email);
        var text3 = document.createTextNode(array[i].Phone);
        var text4 = document.createTextNode(array[i].GST);

        td1.appendChild(text1);
        td2.appendChild(text2);
        td3.appendChild(text3);
        td4.appendChild(text4);

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);

        table.appendChild(tr);
        }
        return table;
    }

    return function(){
        return { LoadData: loadData }
    }

}();