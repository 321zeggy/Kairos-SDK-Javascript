  $(document).ready(function($) {

    var scorecard;

    var global_image_data;
    var global_ratio;

    var kairosBoundingBox;
    var microsoftBoundingBox;
    var ibmBoundingBox;
    var googleBoundingBox;
    var facePlusPlusBoundingBox;

    var responsesCount;

    function incrementResponsesCount() {
      responsesCount += 1;
      if (responsesCount == 5) {
        scorecard.setFaceImage(global_image_data);
        $("#results-button").prop('disabled', false);
        console.log(scorecard);
      }
    }


    jQuery.urlShortener.settings.apiKey = 'AIzaSyDjW-G7go9ZMvuw0oBS6a_RGZgWKOGLxR8';

    function imageToDataUri(img, width, height) {
      // create an off-screen canvas
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      // set its dimension to target size
      canvas.width = width;
      canvas.height = height;

      // draw source image into the off-screen canvas:
      ctx.drawImage(img, 0, 0, width, height);

      // encode image to data-uri with base64 version of compressed image
      return canvas.toDataURL();
    }

    // drawing method
    function drawBoundingBox(face, color) {
      var imageObj = new Image();
      imageObj.onload = function() {
        $('#loading').show();
        $('#photoCanvas').hide();
        var canvas = $('#photoCanvas')[0];
        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(imageObj, 0, 0, imageObj.width * global_ratio, imageObj.height * global_ratio);

        if (face) {
          var top = face.top * global_ratio;
          var left = face.left * global_ratio;
          var width = face.width * global_ratio;
          var height = face.height * global_ratio;

          // draw face box
          context.beginPath();
          context.rect(left, top, width, height);
          context.lineWidth = 4;
          context.strokeStyle = color;
          context.stroke();
        }
        $('#loading').hide();
        $('#photoCanvas').show();
      };
      imageObj.src = global_image_data;
    }

    function drawGoogleBoundingBox(face, color) {
      var imageObj = new Image();
      imageObj.onload = function() {
        $('#loading').show();
        $('#photoCanvas').hide();

        var canvas = $('#photoCanvas')[0];
        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(imageObj, 0, 0, imageObj.width * global_ratio, imageObj.height * global_ratio);

        if (face) {
          context.lineWidth = 4;
          context.strokeStyle = color;
          context.beginPath();
          for (var vertex in face) {
            context.lineTo(face[vertex].x * global_ratio, face[vertex].y * global_ratio);
          }
          context.lineTo(face[0].x * global_ratio, face[0].y * global_ratio);
          context.stroke();
        }
        $('#loading').hide();
        $('#photoCanvas').show();
      };
      imageObj.src = global_image_data;
    }

    function getGender(genderString) {
      return genderString.toUpperCase()[0];
    }

    function microsoftDetectCallback(response) {
      var microsoftJSON = JSON.parse(response.responseText);
      if (!microsoftJSON[0]) {
        $("#microsoft_response").html('No faces detected');
        console.log('no images in Microsoft face response');
        $("#comparison_table .microsoft_gender").html('No faces detected');
        $("#comparison_table .microsoft_age").html('No faces detected');
        scorecard.setMicrosoftFaceDetected(false);
        $("#comparison_table .microsoft_face_detected").html('False');
      } else {
        var attributes = microsoftJSON[0].faceAttributes;
        $("#comparison_table .microsoft_gender").html(getGender(attributes.gender));
        $("#comparison_table .microsoft_age").html(attributes.age);
        $("#comparison_table .microsoft_face_detected").html('True');
        scorecard.setMicrosoftGender(getGender(attributes.gender));
        scorecard.setMicrosoftAge(parseFloat(attributes.age));
        scorecard.setMicrosoftFaceDetected(true);

        var face = microsoftJSON[0].faceRectangle;
        microsoftBoundingBox = {
          top: face.top,
          left: face.left,
          width: face.width,
          height: face.height
        };
        $("#microsoft_response").html(JSON.stringify(attributes, null, 4));
      }
      $('a[href="#microsoft_response"]').removeClass('disabled');
      incrementResponsesCount();
    }

    function ibmDetectCallback(response) {
      var ibmJSON = JSON.parse(response.responseText);
      if (!ibmJSON.images[0].faces[0]) {
        console.log('no images in IBM face response');
        $("#ibm_response").html('No faces detected');

        $("#comparison_table .ibm_gender").html('No faces detected');
        $("#comparison_table .ibm_age").html('No faces detected');
        $("#comparison_table .ibm_face_detected").html('False');
        scorecard.setIBMFaceDetected(false);
      } else {
        var attributes = ibmJSON.images[0].faces[0];
        attributes = {
          "gender": attributes.gender,
          "age": attributes.age
        };
        scorecard.setIBMGender(getGender(attributes.gender.gender));
        $("#comparison_table .ibm_gender").html(getGender(attributes.gender.gender));
        if ('min' in attributes.age) {
          if ('max' in attributes.age) {
            scorecard.setIBMAge(min_age = parseInt(attributes.age.min), max_age = parseInt(attributes.age.max));
            $("#comparison_table .ibm_age").html(attributes.age.min + '-' + attributes.age.max);
          } else {
            $("#comparison_table .ibm_age").html(attributes.age.min);
            scorecard.setIBMAge(min_age = parseInt(attributes.age.min));
          }
        } else {
          scorecard.setIBMAge(max_age = parseInt(attributes.age.max));
          $("#comparison_table .ibm_age").html(attributes.age.max);
        }
        scorecard.setIBMFaceDetected(true);
        $("#comparison_table .ibm_face_detected").html('True');
        var face = ibmJSON.images[0].faces[0].face_location;
        ibmBoundingBox = {
          top: face.top,
          left: face.left,
          width: face.width,
          height: face.height
        };
        $("#ibm_response").html(JSON.stringify(attributes, null, 4));
      }
      $('a[href="#ibm_response"]').removeClass('disabled').click();
      drawBoundingBox(ibmBoundingBox, 'red');
      incrementResponsesCount();
    }


    function kairosDetectCallback(response) {
      var kairosJSON = JSON.parse(response.responseText);
      if ('Errors' in kairosJSON) {
        console.log('no images in Kairos face response');
        $("#kairos_response").html('No faces detected');

        $("#comparison_table .kairos_gender").html('No faces detected');
        $("#comparison_table .kairos_age").html('No faces detected');
        $("#comparison_table .kairos_face_detected").html('False');
        scorecard.setKairosFaceDetected(false);
      } else {
        var attributes = kairosJSON.images[0].faces[0].attributes;
        $("#comparison_table .kairos_gender").html(getGender(attributes.gender.type));
        $("#comparison_table .kairos_age").html(attributes.age);
        $("#comparison_table .kairos_face_detected").html('True');
        scorecard.setKairosGender(getGender(attributes.gender.type));
        scorecard.setKairosAge(parseInt(attributes.age));
        scorecard.setKairosFaceDetected(true);

        var face = kairosJSON.images[0].faces[0];
        kairosBoundingBox = {
          top: face.topLeftY,
          left: face.topLeftX,
          width: face.width,
          height: face.height
        };
        $("#kairos_response").html(JSON.stringify(attributes, null, 4));
      }
      $('a[href="#kairos_response"]').removeClass('disabled');
      incrementResponsesCount();
    }

    function googleDetectCallback(response) {
      var googleJSON = JSON.parse(response.responseText);
      if (!('faceAnnotations' in googleJSON.responses[0])) {
        console.log('no images in Google face response');
        $("#google_response").html('No faces detected');
        scorecard.setGoogleFaceDetected(false);
      } else {
        var attributes = googleJSON.responses[0].faceAnnotations[0];
        attributes = {
          detectionConfidence: attributes.detectionConfidence,
          joyLikelihood: attributes.joyLikelihood,
          sorrowLikelihood: attributes.sorrowLikelihood,
          angerLikelihood: attributes.angerLikelihood,
          surpriseLikelihood: attributes.surpriseLikelihood,
          underExposedLikelihood: attributes.underExposedLikelihood,
          blurredLikelihood: attributes.blurredLikelihood,
          headwearLikelihood: attributes.headwearLikelihood
        };
        googleBoundingBox = googleJSON.responses[0].faceAnnotations[0].fdBoundingPoly.vertices;
        $("#google_response").html(JSON.stringify(attributes, null, 4));
        scorecard.setGoogleFaceDetected(true);
      }
      $('a[href="#google_response"]').removeClass('disabled');
      incrementResponsesCount();
    }

    function facePlusPlusDetectCallback(response) {
      var facePlusPlusJSON = response;
      if (!facePlusPlusJSON.faces[0]) {
        console.log('no images in Face++ face response');
        $("#faceplusplus_response").html('No faces detected');
        $("#comparison_table .faceplusplus_gender").html('No faces detected');
        $(".faceplusplus_age").html('No faces detected');
        $("#comparison_table .faceplusplus_face_detected").html('False');
        scorecard.setFacePlusPlusFaceDetected(false);
      } else {
        var attributes = facePlusPlusJSON.faces[0].attributes;
        $("#comparison_table .faceplusplus_gender").html(getGender(attributes.gender.value));
        $("#comparison_table .faceplusplus_age").html(attributes.age.value);
        $("#comparison_table .faceplusplus_face_detected").html('True');
        scorecard.setFacePlusPlusGender(getGender(attributes.gender.value));
        scorecard.setFacePlusPlusAge(parseInt(attributes.age.value));
        scorecard.setFacePlusPlusFaceDetected(true);

        var face = facePlusPlusJSON.faces[0].face_rectangle;
        facePlusPlusBoundingBox = {
          top: face.top,
          left: face.left,
          width: face.width,
          height: face.height
        };
        $("#faceplusplus_response").html(JSON.stringify(attributes, null, 4));
      }
      $('a[href="#faceplusplus_response"]').removeClass('disabled');
      incrementResponsesCount();
    }

    function reset() {
      scorecard = new ScoreCard();
      $('.modal-1').show();
      $('.modal-2').hide();
      $('.modal-3').hide();
      document.getElementById('actual_values_form').reset();


      responsesCount = 0;

      global_image_data = null;
      global_ratio = null;

      $('.nav-link').addClass('disabled');
      $("#results-button").prop('disabled', true);

      $('#camera').hide();

      $("#photoCanvas").hide();
      $("#loading").show();

      $("#kairos_response").html("<i>(Kairos response will appear here)</i>");
      $("#microsoft_response").html("<i>(Microsoft response will appear here)</i>");
      $("#ibm_response").html("<i>(IBM response will appear here)</i>");
      $("#google_response").html("<i>(Google response will appear here)</i>");
      $("#faceplusplus_response").html("<i>(Face++ response will appear here)</i>");

      kairosBoundingBox = null;
      microsoftBoundingBox = null;
      ibmBoundingBox = null;
      facePlusPlusBoundingBox = null;
      googleBoundingBox = null;
    }

    // get ratio by which to multiply image width and height in order to fit canvas
    function getConversionRatio(imageObj, maxWidth, maxHeight) {
      return Math.min(maxWidth / imageObj.width, maxHeight / imageObj.height);
    }


    function handleFileSelect(file) {
      reset();
      console.log(file);
      if (file.type.match('image.*')) { // Only process image files
        var reader = new FileReader();
        reader.onload = function(e) {
          var canvas = $('#photoCanvas')[0];
          var context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);
          var imageObj = new Image();
          imageObj.onload = function() {
            var ratio = getConversionRatio(imageObj, 400, 400);
            if (!global_ratio) {
              global_ratio = ratio;
              imageObj.src = imageToDataUri(imageObj, imageObj.width, imageObj.height);
            } else {
              context.drawImage(imageObj, 0, 0, imageObj.width * ratio, imageObj.height * ratio);

              var image_data = String(imageObj.src);
              image_data = image_data.replace("data:image/jpeg;base64,", "");
              image_data = image_data.replace("data:image/jpg;base64,", "");
              image_data = image_data.replace("data:image/png;base64,", "");
              image_data = image_data.replace("data:image/gif;base64,", "");
              image_data = image_data.replace("data:image/bmp;base64,", "");
              global_image_data = 'data:image/jpeg;base64,' + image_data;

              Kairos.detect(image_data, kairosDetectCallback);
              Google.detect(image_data, googleDetectCallback, is_url = false);

              var dataReader = new FileReader();
              dataReader.onloadend = function(e) {
                Microsoft.detect(e.target.result, microsoftDetectCallback, is_url = false);
              };
              dataReader.readAsArrayBuffer(file);

              var ibmFormData = new FormData();
              ibmFormData.append('images_file', file, file.name);
              IBM.detect(ibmFormData, ibmDetectCallback, is_url = false);

              var facePlusPlusFormData = new FormData();
              facePlusPlusFormData.append('image_file', file, file.name);
              FacePlusPlus.detect(facePlusPlusFormData, facePlusPlusDetectCallback, is_url = false);
            }

          };
          imageObj.src = e.target.result;
        };
        // Read in the image file as a data URL.
        reader.readAsDataURL(file);
      }
    }


    function handleURLSelect(image_url) {
      $("#file").val('');
      var canvas = $('#photoCanvas')[0];
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      reset();
      var imageObj = new Image();

      imageObj.onload = function() {
        var ratio = getConversionRatio(imageObj, 400, 400);
        context.drawImage(imageObj, 0, 0, imageObj.width * ratio, imageObj.height * ratio);
        global_image_data = imageObj.src;
        global_ratio = ratio;

        Kairos.detect(imageObj.src, kairosDetectCallback);
        FacePlusPlus.detect(image_url, facePlusPlusDetectCallback, is_url = true);
        Microsoft.detect(imageObj.src, microsoftDetectCallback, is_url = true);
        IBM.detect(imageObj.src, ibmDetectCallback, is_url = true);
        Google.detect(imageObj.src, googleDetectCallback, is_url = true);
      };
      imageObj.src = image_url;
    }

    var FormStuff = {

      init: function() {
        this.applyConditionalRequired();
        this.bindUIActions();
      },

      bindUIActions: function() {
        $("input[type='radio'], input[type='checkbox']").on("change", this.applyConditionalRequired);
      },

      applyConditionalRequired: function() {

        $(".require-if-active").each(function() {
          var el = $(this);
          if ($(el.data("require-pair")).is(":checked")) {
            el.prop("required", true);
            el.parents('.reveal-if-active').addClass('revealed');
          } else {
            el.prop("required", false);
            el.parents('.reveal-if-active').removeClass('revealed');
          }
        });

      }

    };

    FormStuff.init();



    $('#file').change(function(evt) {
      if ($("#file").val !== '') {
        var file = evt.target.files[0];
        handleFileSelect(file);
      }
    });
    $('#submit_photo_url').click(function(evt) {
      jQuery.urlShortener({
        longUrl: $("#photo_url").val(),
        success: function(shortUrl) {
          $("#photo_url").val('');
          handleURLSelect(shortUrl);
        },
        error: console.log
      });
      return false;
    });

    function dataURItoBlob(dataURI) {
      // convert base64/URLEncoded data component to raw binary data held in a string
      var byteString;
      if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
      else
        byteString = unescape(dataURI.split(',')[1]);

      // separate out the mime component
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

      // write the bytes of the string to a typed array
      var ia = new Uint8Array(byteString.length);
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      return new Blob([ia], {
        type: mimeString
      });
    }

    $('.sample-img').click(function(evt) {
      // var url = $(this).data("url");
      var url = $(this).attr('src');
      var imageObj = new Image();
      imageObj.onload = function() {
        var blob = dataURItoBlob(imageToDataUri(imageObj, imageObj.width, imageObj.height));
        blob.name = 'blob.png';
        handleFileSelect(blob);
      };
      imageObj.src = url;

      return false;
    });


    $('a[href="#ibm_response"]').on('show.bs.tab', function() {
      drawBoundingBox(ibmBoundingBox, 'red');
    });
    $('a[href="#microsoft_response"]').on('show.bs.tab', function() {
      drawBoundingBox(microsoftBoundingBox, 'green');
    });
    $('a[href="#faceplusplus_response"]').on('show.bs.tab', function() {
      drawBoundingBox(facePlusPlusBoundingBox, 'purple');
    });
    $('a[href="#google_response"]').on('show.bs.tab', function() {
      drawGoogleBoundingBox(googleBoundingBox, 'yellow');
    });
    $('a[href="#kairos_response"]').on('show.bs.tab', function() {
      drawBoundingBox(kairosBoundingBox, 'blue');
    });


    $('.modal-2').hide();
    $('.modal-3').hide();

    $('button.modal-1').click(function() {
      $('.modal-1').hide();
      $('.modal-2').show();
    });

    $('input.modal-2').click(function() {
      $('.modal-2').hide();
      $('.modal-3').show();
    });

    $('#loading').hide();
    $('#photoCanvas').hide();

    $('#actual_values_form').submit(function() {
      var gender, age;
      if ($('input.choice-gender[name=choice-attributes]:checked').length > 0) {
        gender = $('input[name=gender]:checked').val();
      }
      if ($('input.choice-age[name=choice-attributes]:checked').length > 0) {
        age = $('input[name=age]').val();
      }
      scorecard.updateTotalScore(gender, age);
      return false;
    });

    $('#results-button').click(function() {
      $('.modal-1').show();
      $('.modal-2').hide();
      $('.modal-3').hide();
    });

    $('[data-toggle="tooltip"]').tooltip();

    var camera = new JpegCamera("#camera");

    $('#camera-button').click(function() {
      camera.show_stream();
      $('#loading').hide();
      $('#photoCanvas').hide();
      $('#camera').show();
    });

    $('#sample1').click();

  });