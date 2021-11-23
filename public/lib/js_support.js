(function() {
  var myCustomData = { origin: 'mouse' };
  var event = new CustomEvent('checkHideCtrls', { detail: myCustomData });
  window.onmousemove = function(e) {
    window.parent.document.dispatchEvent(event);
  };
})();

function pdfTronvisibilityElements(_visibility) {
  try {
    if (_visibility == 'hide') {
      document.getElementsByClassName('Header open')[0].classList.add('ocv_hide_for_inactive');
      document.getElementsByClassName('DocumentContainer')[0].classList.add('ocv_hide_for_inactive');
    }
    if (_visibility == 'show') {
      document.getElementsByClassName('Header open')[0].classList.remove('ocv_hide_for_inactive');
      document.getElementsByClassName('DocumentContainer')[0].classList.remove('ocv_hide_for_inactive');
    }
  } catch (err) {}
}

(function() {
  try {
    var _current_d_scrollTop = 0;
    document.getElementsByClassName('DocumentContainer')[0].onscroll = function(e) {
      if (e.target.scrollTop > _current_d_scrollTop) {
		var event = new CustomEvent('checkHideCtrlsForce', { detail: { force: true } });
		window.parent.document.dispatchEvent(event);
      }
      if (e.target.scrollTop < _current_d_scrollTop) {
		var event = new CustomEvent('checkHideCtrlsForce', { detail: { force: false } });
		window.parent.document.dispatchEvent(event);
      }
      _current_d_scrollTop = e.target.scrollTop;
    };
  } catch (err) {
    console.log(err);
  }
})();
