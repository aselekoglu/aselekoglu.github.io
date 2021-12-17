let clipboard = new ClipboardJS(".btn");

var searchBlock = document.getElementById('output');
var links = document.getElementsByClassName('sc-hzDkRC')

function generateSig() {

    var name = document.getElementById('full-name').value,
        title = document.getElementById('title').value,
        email = document.getElementById('email').value,
        phone = document.getElementById('phone').value,
        photo_id = document.getElementById('photo-id').value;

    console.log(name, title, email, phone, photo_id, searchBlock);

    $(searchBlock).find('#sign-name').text(name);
    $(searchBlock).find('#sign-title').text(title);
    $(searchBlock).find('#sign-email-vis').text(email);
    $(searchBlock).find('#sign-email-href').attr('href', 'mailto:' + email);
    $(searchBlock).find('#sign-mobile-vis').text(phone);
    $(searchBlock).find('#sign-mobile-href').attr('href', 'tel:' + phone);
    $(searchBlock).find('#photo').attr('src', 'https://drive.google.com/uc?id=' + photo_id);

    $(links).each(function () {
        var $this = $(this);
        var _href = $this.attr("href");
        $this.attr("href", _href + email)
    })

    console.log($(links).attr("href"))

    $('button').show();
}

clipboard.on('success', function (e) {
    $('#js-copy').val('Successfully copied!');
});

clipboard.on('error', function (e) {
    $('#js-copy').val('Could not be copied. See console for the error log.');
    console.log(e);
});


