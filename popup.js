// 获取本地局域网IP
function getLocalIPs() {
    var ips   = [];
    var defer = Promise.defer();

    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;

    var rtc = new RTCPeerConnection({
        iceServers: []
    });

    rtc.createDataChannel('');

    rtc.onicecandidate = function (e) {
        if (!e.candidate) {
            defer.resolve(ips);
            return;
        }

        var ip = /^candidate:.+ (\S+) \d+ typ/.exec(e.candidate.candidate)[1];
        if (ips.indexOf(ip) == -1) {
            ips.push(ip);
        }
    };
    rtc.createOffer(function (sdp) {
        rtc.setLocalDescription(sdp);
    });

    return defer.promise;
}

chrome.tabs.query({
    active       : true,
    currentWindow: true
}, function (tabs) {
    var url = tabs[0].url;
    var qr  = document.getElementById("qr");
    var txt = qr.querySelector('textarea');
    var img, qrcode, localIp;

    txt.value = url;

    // get storage options
    var defer = Promise.defer();

    chrome.storage.sync.get(function (options) {
        defer.resolve(options || {});
    });

    // get local ip
    var promise;

    if (hostname(url) == 'localhost') {
        qr.classList.add('loading');
        promise = getLocalIPs();
    }

    Promise.all([defer.promise, promise]).then(function (result) {
        var options = result[0];
        var ips     = result[1];

        var color;
        var text = url;

        if (options.isBlack) {
            color = '#000000';
        } else {
            color = randomColor({
                luminosity: 'dark'
            });
        }

        qr.classList.remove('loading');

        // localhost replace with local ip
        if (ips) {
            localIp = ips[0];
            text    = url.replace('localhost', localIp);
        } else {
            getLocalIPs().then(function (ips) {
                localIp = ips[0];
            });
        }

        qrcode = new QRCode(qr, {
            text        : text,
            width       : 240,
            height      : 240,
            colorDark   : color,
            colorLight  : "#ffffff",
            correctLevel: QRCode.CorrectLevel.L
        });

        qr.querySelector('canvas').remove();

        img = qr.querySelector('img');
        img.addEventListener('click', showInput);
    });

    document.addEventListener('keypress', function (e) {
        if (e.which !== 13) {
            return;
        }

        // enter new line
        if (e.shiftKey || e.ctrlKey) {
            return;
        }

        // prevent new line
        e.preventDefault();

        if (img.classList.contains('hide')) {
            showMain();
        } else {
            showInput();
        }
    });

    function hostname(href) {
        var host;

        try {
            host = new (window.URL || windowwebkitURL)(href).hostname;
        } catch (e) {

        }
        return host;
    }

    function showMain() {
        var text;
        var val = txt.value.trim();

        if (!val) {
            text      = url;
            txt.value = url;
        } else {
            text = val;
        }

        if (hostname(text) == 'localhost') {
            text = text.replace('localhost', localIp);
        }

        qrcode.makeCode(text);

        txt.style.display = 'none';
        img.classList.remove('hide');
    }

    function showInput() {
        img.classList.add('hide');
        txt.style.display = 'block';

        txt.value = txt.value.trim();
        txt.select();
    }
});
