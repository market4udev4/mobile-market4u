$.fn.visible = function(partial, height_add, this_height) {
    height_add = typeof height_add == 'undefined' ? 0 : height_add;
    this_height = typeof this_height == 'undefined' ? 0 : this_height;
    try {
        var $t            = $(this),
            $w            = $(window),
            viewTop       = $w.scrollTop(),
            viewBottom    = viewTop + $w.height(),
            _top          = $t.offset().top + height_add,
            _bottom       = _top + (this_height?1:$t.height()),
            compareTop    = partial === true ? _bottom : _top,
            compareBottom = partial === true ? _top : _bottom;

        return ((compareBottom <= viewBottom) && (compareTop >= viewTop));
    } catch (err) {
        return false;
    }
};