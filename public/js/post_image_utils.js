document.addEventListener("DOMContentLoaded", function (event) {
    $('#image').on('input', function (event) {
        $('#img-preview').attr('src', $('#image').val());
    });
});