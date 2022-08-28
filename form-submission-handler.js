(function(_mailUtil, _masterDataUtil) {
  var mailUtil = _mailUtil();
  var masterDataUtil = _masterDataUtil();

  var fieldValidation = {};

  // get all data in form and return object
  function getFormData(form) {
    var elements = form.elements;
    var honeypot;

    var fields = Object.keys(elements).filter(function(k) {
      if (elements[k].name === "honeypot") {
        honeypot = elements[k].value;
        return false;
      }
      return true;
    }).map(function(k) {
      if(elements[k].name !== undefined) {
        return elements[k].name;
      // special case for Edge's html collection
      }else if(elements[k].length > 0){
        return elements[k].item(0).name;
      }
    }).filter(function(item, pos, self) {
      return self.indexOf(item) == pos && item;
    });

    var formData = {};
    fields.forEach(function(name){
      var element = elements[name];
      
      // singular form elements just have one value
      formData[name] = element.value;

      // when our element has multiple items, get their values
      if (element.length) {
        var data = [];
        for (var i = 0; i < element.length; i++) {
          var item = element.item(i);
          if (item.checked || item.selected) {
            data.push(item.value);
          }
        }
        formData[name] = data.join(', ');
      }
    });

    //if(mailUtil.IS_EMAILQUOTA_EXCEEDED){
      //formData.formQuotaWarningMsg = "Warning: Daily limit about to exhaust! ";
    //}else{
      //formData.formQuotaWarningMsg = "Contact Form Submitted: ";
    //}

    // add form-specific values into the data
    formData.formDataNameOrder = JSON.stringify(fields);
    formData.formGoogleSheetName = form.dataset.sheet || "responses"; // default sheet name
    formData.formGoogleSendEmail
      = form.dataset.email || ""; // no email by default

    return {data: formData, honeypot: honeypot};
  }

  function handleFormSubmit(event) {  // handles form submit without any jquery
    event.preventDefault();           // we are submitting via xhr below
    var form = event.target;
    var formData = getFormData(form);
    var data = formData.data;

    // If a honeypot field is filled, assume it was done so by a spam bot.
    if (formData.honeypot) {
      return false;
    }

    //disableAllButtons(form);

    var enteredEmail = document.getElementById('email').value;

    masterDataUtil.LoadFieldConfigInfo().then((fieldConfig) => {    
      masterDataUtil.LoadData(enteredEmail).then((result) => {
        if(result.Exists) {
          console.log('Sent!');
          //un-comment below to send mail
          mailUtil.SendMail(data, success, failure);
        }else{
          fieldValidation = fieldConfig;
          var tblContent = modalBody(result.ModalFields, fieldValidation);
          $('#myModal').find('.modal-body').html(tblContent);
          $('#myModal').modal('show'); 
        }
      });
    });

  }

  function success(event){
      var form = document.getElementById('frmContactUs');
      var formElements = form.querySelector(".form-elements")
      if (formElements) {
        formElements.style.display = "none"; // hide form
      }
              
      var thankYouMessage = form.querySelector(".thankyou_message");
      if (thankYouMessage) {
        thankYouMessage.style.display = "block";
      }
  }

  function failure(err){
    console.log('Error sending mail!', err);
  }

  function loadModalData(e)
  {
    document.getElementById('lblValidationSummary').innerHTML = '';
    document.getElementById('lblMsg').innerHTML ='';

    var enteredTxt = document.getElementById('email').value;
    var mail_phone_regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})|([0-9]{10})+$/;

    if(!enteredTxt.match(mail_phone_regex)){
      alert('Please enter valid email / phone number');
      return;
    }

    if(enteredTxt){
      document.getElementById('lblMsg').innerHTML = "";
      e.preventDefault();    

      masterDataUtil.LoadFieldConfigInfo().then((fieldConfig) => {
        masterDataUtil.LoadData(enteredTxt).then((result) => {
          fieldValidation = fieldConfig;
          var tblContent = modalBody(result.ModalFields, fieldValidation);
          $('#myModal').find('.modal-body').html(tblContent);
          $('#myModal').modal('show');        
        });
      })
    }else{
      alert('Please enter email address');
    }
  } 

  function modalBody(dataObjct, fieldConfigArray)
  {
      var table = document.createElement('table');        

      for (const objProp of Object.entries(dataObjct)) {
          if(objProp[0] !== "rowIndex"){
              var tr = document.createElement('tr');
              var td1 = document.createElement('td');
              var td2 = document.createElement('td');
  
              var labelControl = document.createTextNode(objProp[0]);             
              var htmlControl = document.createElement("input");
              htmlControl.id = objProp[0];
              htmlControl.value = objProp[1];

              if(fieldConfigArray){
                var field = fieldConfigArray.FieldConfigData.find(f =>  f.FieldName === objProp[0]);

                htmlControl.type = field.FieldType;
                htmlControl.placeholder = field.PlaceHolder;
                htmlControl.required = (field.IsRequired.toUpperCase() === "YES") ? true : false;
                //htmlControl.className = "css-class-name";
              }
  
              td1.appendChild(labelControl);
              td2.appendChild(htmlControl);    
      
              tr.appendChild(td1);
              tr.appendChild(td2);
              
              table.appendChild(tr);
          }

      }

      return table;
  }

  function handlePopupFormSubmit(event) { 
    var lblMsg = document.getElementById('lblMsg');
    var lblValSummary = document.getElementById('lblValidationSummary');
    lblMsg.innerHTML = 'Validating inputs...';
    lblValSummary.innerHTML = '';

    var divElem = document.querySelector(".modal-body");
    var inputElements = divElem.querySelectorAll("input");
    var dataObj = {};
    var isFormValid = true;
    var validationMsg = '';
    for (var i = 0; i < inputElements.length; i++) {

      var field = fieldValidation.FieldConfigData.find(f =>  f.FieldName === inputElements[i].id);
      
      if(!new RegExp(field.Pattern).test(inputElements[i].value)){
        isFormValid = false;
        validationMsg += field.FieldName + ": " + field.ValidationMessage + '<br/>';
      } 

      dataObj[inputElements[i].id] = inputElements[i].value;
    }
  
    if(isFormValid)
    {
      masterDataUtil.SaveMasterData(dataObj).then((resp)=> {
          lblMsg.innerHTML = "Master Data Saved!";
          lblMsg.style.color = "green";
      }).catch((err)=>{
        lblMsg.innerHTML = "CORS Error Occured!";
        lblMsg.style.color = "red";
      });
    }else{
      lblMsg.innerHTML = "Please provide valid input!";
      lblMsg.style.color = "red";
      lblValSummary.innerHTML = validationMsg;
    }

    var emailInput = document.getElementById('btnSaveData');
    emailInput.removeEventListener("click", handlePopupFormSubmit);
    //event.stopPropagation();
  }

  function loaded() {

    mailUtil.Initialize();

    // bind to the submit event of our form
    
    var forms = document.querySelectorAll("form.gform");
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", handleFormSubmit, false);
    }

    
    $('#myModal').on('show.bs.modal', function (event) {
      var emailInput = document.getElementById('btnSaveData');

      if(!emailInput.onclick){
        emailInput.onclick = function(event){
          
          handlePopupFormSubmit(event); 
          event.preventDefault();
        }
      }   
    });

    var editInput = document.getElementById('btnEditMasterData');

    editInput.addEventListener('click', (event) => { 
      loadModalData(event);     
    });

  };

  document.addEventListener("DOMContentLoaded", loaded, false);

  function disableAllButtons(form) {
    var buttons = form.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
    }
  }
})(mailUtil, masterDataUtil);
