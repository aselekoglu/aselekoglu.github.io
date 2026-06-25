// Initialize ClipboardJS on the Copy as Text button
let clipboard = new ClipboardJS("#js-copy");

const searchBlock = document.getElementById('output');
const links = document.getElementsByClassName('sc-hzDkRC');
const checkbox = document.getElementById('meeting-checkbox');
const hiddenElement = document.getElementById('hidden');
const hiddenSig = document.getElementById('hidden-sig');

// Handle meeting checkbox toggle
checkbox.addEventListener('change', function () {
    if (checkbox.checked) {
        hiddenElement.style.display = 'block';
        hiddenSig.style.display = 'block';
    } else {
        hiddenElement.style.display = 'none';
        hiddenSig.style.display = 'none';
    }
    generateSig();
});

// Update signature preview
function generateSig() {
    const signature = {
        name: document.getElementById('full-name').value,
        title: document.getElementById('title').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
    };

    const meetLink = document.getElementById('meeting-link').value;

    // Update name
    $(searchBlock).find('#sign-name').text(signature.name);
    
    // Update title
    $(searchBlock).find('#sign-title').text(signature.title);
    
    // Update email visible text and href
    $(searchBlock).find('#sign-email-vis').text(signature.email);
    $(searchBlock).find('#sign-email-href').attr('href', 'mailto:' + signature.email);
    
    // Update phone visible text and href
    $(searchBlock).find('#sign-mobile-vis').text(signature.phone);
    $(searchBlock).find('#sign-mobile-href').attr('href', 'tel:' + signature.phone);
    
    // Update meeting link
    $(searchBlock).find('#hidden-sig').attr('href', meetLink);

    // Update campaign link queries with email (avoiding double-appending on real-time typing)
    $(links).each(function () {
        const $this = $(this);
        let baseHref = $this.data('base-href');
        if (!baseHref) {
            baseHref = $this.attr("href");
            $this.data('base-href', baseHref);
        }
        $this.attr("href", baseHref + signature.email);
    });
}

// Attach event listeners for real-time typing preview updates
$('#full-name, #title, #email, #phone, #meeting-link').on('input', generateSig);

// ClipboardJS success handler with visual feedback
clipboard.on('success', function (e) {
    const $btn = $(e.trigger);
    $btn.addClass('copied');
    const $label = $btn.find('span');
    const originalText = $label.text();
    
    $label.text('Copied as Text!');
    
    setTimeout(function () {
        $btn.removeClass('copied');
        $label.text(originalText);
    }, 2000);
});

clipboard.on('error', function (e) {
    const $btn = $(e.trigger);
    const $label = $btn.find('span');
    const originalText = $label.text();
    
    $label.text('Copy failed!');
    setTimeout(function () {
        $label.text(originalText);
    }, 2000);
});

// Copy HTML source handler with visual feedback
function copyHTML() {
    const outerHTML = document.getElementById('code').outerHTML;
    navigator.clipboard.writeText(outerHTML).then(function() {
        const $btn = $('#hs-copy');
        $btn.addClass('copied');
        const $label = $btn.find('span');
        const originalText = $label.text();
        
        $label.text('Copied HTML Source!');
        
        setTimeout(function () {
            $btn.removeClass('copied');
            $label.text(originalText);
        }, 2000);
    }).catch(function(err) {
        console.error('Could not copy HTML: ', err);
    });
}

// Perform initial rendering of values on page load
$(document).ready(function() {
    generateSig();
});
