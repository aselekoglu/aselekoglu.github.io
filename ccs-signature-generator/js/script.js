let clipboard = new ClipboardJS(".btn");

var searchBlock = document.getElementById('output');
var links = document.getElementsByClassName('sc-hzDkRC')
const checkbox = document.getElementById('meeting-checkbox')
const hiddenElement = document.getElementById('hidden')
const hiddenSig = document.getElementById('hidden-sig')

checkbox.addEventListener('click', function handleClick() {
    if (checkbox.checked) {
        hiddenElement.style.display = 'block';
        hiddenSig.style.display = 'block';

    } else {
        hiddenElement.style.display = 'none';
        hiddenSig.style.display = 'none';
    }
})

// console.log(URLSearchParams);

function generateSig() {

    var signature = {
        name: document.getElementById('full-name').value,
        title: document.getElementById('title').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        photo_id: document.getElementById('photo-id').value
    }

    var meetLink = document.getElementById('meeting-link').value


    // console.log(name, title, email, phone, photo_id, searchBlock);

    $(searchBlock).find('#sign-name').text(signature.name);
    $(searchBlock).find('#sign-title').text(signature.title);
    $(searchBlock).find('#sign-email-vis').text(signature.email);
    $(searchBlock).find('#sign-email-href').attr('href', 'mailto:' + signature.email);
    $(searchBlock).find('#sign-mobile-vis').text(signature.phone);
    $(searchBlock).find('#sign-mobile-href').attr('href', 'tel:' + signature.phone);
    $(searchBlock).find('#photo').attr('src', 'https://drive.google.com/uc?id=' + signature.photo_id);
    $(searchBlock).find('#hidden-sig').attr('href', meetLink);

    $(links).each(function () {
        var $this = $(this);
        var _href = $this.attr("href");
        $this.attr("href", _href + signature.email)
    })

    // console.log($(links).attr("href"))

    $('button').show();
}

clipboard.on('success', function (e) {
    console.log(e)
    // console.log(document.getElementById("code"))
    var id = "";
    id = id.concat("#", e.trigger.attributes[0].nodeValue.toString())
    $(id).val('Successfully copied!');
});


clipboard.on('error', function (e) {
    var id = "";
    id = id.concat("#", e.trigger.attributes[0].nodeValue.toString())
    $(id).val('Could not be copied. See console for the error log.');
    // console.log(e);
});

function copyHTML() {
    var outerHTML = document.getElementById('code').outerHTML;
    // console.log(outerHTML)
    navigator.clipboard.writeText(outerHTML);
    $('#hs-copy').val('Successfully copied!');
}

