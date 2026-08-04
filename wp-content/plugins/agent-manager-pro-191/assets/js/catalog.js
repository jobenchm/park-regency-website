/*!
 * Agent Manager Pro — Catalog JS v4
 * All interactive non-form elements are <div>/<span> role="button".
 * SVG colors hardcoded in HTML attributes — immune to Elementor Kit overrides.
 */
(function($) {
    'use strict';

    if ( typeof AMP_VARS === 'undefined' ) return;

    var W, G, Loader, Pager, Overlay;
    var state = {
        search:'', featured:'', orderby:'menu_order',
        paged:1, per_page:12, view:'grid', pages:1, show_modal:'1',
    };
    var cfg = {};
    var timer;

    /* ─── INIT ─── */
    function init() {
        W = $('.amp-wrap');
        if ( !W.length ) return;

        G      = $('#amp-grid');
        Loader = $('#amp-loader');
        Pager  = $('#amp-pager');
        Overlay= $('#amp-overlay');

        state.per_page = parseInt( W.data('per-page') ) || 12;
        state.orderby  = W.data('order') || 'menu_order';
        state.featured = W.data('featured') === '1' ? '1' : '';
        cfg.showExcerpt = W.data('show-excerpt') === '1';
        cfg.showEmail   = W.data('show-email')   === '1';
        cfg.showPhone   = W.data('show-phone')   === '1';
        cfg.showSocial  = W.data('show-social')  === '1';

        var cols = parseInt( W.data('cols') ) || 3;
        G.attr('data-cols', cols);
        $('#amp-sort').val( state.orderby );

        bindEvents();
        fetch();
    }

    /* ─── EVENTS ─── */
    function bindEvents() {

        /* Search */
        $('#amp-search').on('input', function() {
            state.search = $(this).val();
            state.paged  = 1;
            var hasVal = state.search.length > 0;
            $('#amp-search-clear').toggleClass('visible', hasVal);
            clearTimeout(timer);
            timer = setTimeout(fetch, 380);
        });

        /* Clear — span role="button" */
        $('#amp-search-clear').on('click keypress', function(e) {
            if (e.type==='keypress' && e.which!==13 && e.which!==32) return;
            $('#amp-search').val('').trigger('input');
        });

        /* Dropdowns */
        $('#amp-sort').on('change',      function() { state.orderby  =$(this).val(); state.paged=1; fetch(); });

        /* Featured toggle */
        $('#amp-featured-toggle').on('change', function() {
            state.featured = $(this).is(':checked') ? '1' : '';
            state.paged = 1; fetch();
        });

        /* Reset — span role="button" */
        $('#amp-reset').on('click keypress', function(e) {
            if (e.type==='keypress' && e.which!==13 && e.which!==32) return;
            resetFilters();
        });
    }

    /* ─── STATIC DATA (no WordPress backend) ───
     * Agents are served from a pre-exported JSON snapshot instead of
     * admin-ajax.php; search / sort / pagination run client-side. */
    var ampAll = null;

    function loadData(cb) {
        if (ampAll) { cb(ampAll); return; }
        var url = AMP_VARS.data_url ||
                  AMP_VARS.ajax_url.replace('wp-admin/admin-ajax.php', 'wp-content/amp-agents.json');
        $.getJSON(url)
            .done(function(r) {
                if (!r.success) { showError(); showLoading(false); return; }
                ampAll = r.data.agents || [];
                state.show_modal = r.data.show_modal;
                cb(ampAll);
            })
            .fail(function() { showError(); showLoading(false); });
    }

    function fetch() {
        showLoading(true);
        loadData(function(all) {
            var list = all.slice();
            if (state.search) {
                var q = state.search.toLowerCase();
                list = list.filter(function(a) {
                    return (a.name || '').toLowerCase().indexOf(q) !== -1 ||
                           (a.email || '').toLowerCase().indexOf(q) !== -1;
                });
            }
            if (state.featured === '1') {
                list = list.filter(function(a) { return a.featured === '1'; });
            }
            if (state.orderby === 'name_asc')       list.sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
            else if (state.orderby === 'name_desc') list.sort(function(a, b) { return (b.name || '').localeCompare(a.name || ''); });
            else if (state.orderby === 'newest')    list.sort(function(a, b) { return parseInt(b.id, 10) - parseInt(a.id, 10); });
            else if (state.orderby === 'featured')  list.sort(function(a, b) { return (b.featured === '1' ? 1 : 0) - (a.featured === '1' ? 1 : 0); });

            var total = list.length;
            var pages = Math.max(1, Math.ceil(total / state.per_page));
            if (state.paged > pages) state.paged = pages;
            var slice = list.slice((state.paged - 1) * state.per_page, state.paged * state.per_page);

            state.pages = pages;
            renderCards(slice);
            renderPager(pages, state.paged);
            updateCount(total);
            showLoading(false);
        });
    }

    /* ─── CARDS ─── */
    function renderCards(agents) {
        Loader.addClass('hidden');
        G.find('.amp-card, .amp-empty').remove();
        if (!agents || !agents.length) { G.append(emptyState()); return; }
        $.each(agents, function(i, a) { G.append(buildCard(a, i)); });
        G.toggleClass('amp-list', state.view === 'list');
    }

    function buildCard(a, i) {

        /* SVG icons — olive colored */
        var phoneSVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b907c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.33 9a19.79 19.79 0 01-3.07-8.67A2 2 0 012.18 0H5.2a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>';
        var mailSVG  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b907c" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>';
        var globeSVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b907c" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>';

        /* Photo */
        var feat = a.featured==='1' ? '<div class="amp-card-feat">Featured</div>' : '';

        /* Contacts — C:, P:, Email, Website */
        var contacts = '';
        if (a.mobile)  contacts += '<a href="tel:'+esc(a.mobile)+'"  class="amp-clink" onclick="event.stopPropagation()">'+phoneSVG+'<span class="amp-ckey">C:</span><span>'+esc(a.mobile)+'</span></a>';
        if (a.phone)   contacts += '<a href="tel:'+esc(a.phone)+'"   class="amp-clink" onclick="event.stopPropagation()">'+phoneSVG+'<span class="amp-ckey">P:</span><span>'+esc(a.phone)+'</span></a>';
        if (a.email)   contacts += '<a href="mailto:'+esc(a.email)+'" class="amp-clink" onclick="event.stopPropagation()">'+mailSVG+'<span>Email</span></a>';
        if (a.website) {
            var ws = a.website.replace(/^https?:\/\/(www\.)?/,'');
            if (ws.length>28) ws = ws.substring(0,25)+'…';
            contacts += '<a href="'+esc(a.website)+'" class="amp-clink" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+globeSVG+'<span>'+esc(ws)+'</span></a>';
        }

        /* Socials */
        var socs = buildSocials(a, 'amp-soc', true);

        var $c = $(
            '<div class="amp-card amp-card--no-photo" role="listitem" tabindex="0" aria-label="View '+esc(a.name)+'s profile" style="animation-delay:'+(i*0.04)+'s">'+
                feat+
                '<div class="amp-card-body">'+
                    '<div class="amp-card-name">'+esc(a.name)+'</div>'+
                    '<div class="amp-card-bar"></div>'+
                    (a.license  ? '<div class="amp-caldre-top">'+esc(a.license)+'</div>' : '')+
                    (a.position ? '<div class="amp-card-pos">'+esc(a.position)+'</div>' : '')+
                    '<div class="amp-card-contacts">'+contacts+'</div>'+
                    (socs ? '<div class="amp-card-socials">'+socs+'</div>' : '')+
                '</div>'+
            '</div>'
        );

        /* Always redirect to full agent profile — no modal */
        $c.on('click keypress', function(e) {
            if (e.type==='keypress' && e.which!==13) return;
            window.location.href = a.permalink;
        });
        return $c;
    }

    /* ─── MODAL (disabled — cards redirect to permalink directly) ─── */

    /* ─── HELPERS ─── */
    function mRow(ico, txt, href) {
        var content = href ? '<a href="'+href+'">'+txt+'</a>' : '<span>'+txt+'</span>';
        return '<div class="amp-mdetail"><span class="amp-mdetail-ico">'+ico+'</span>'+content+'</div>';
    }
    function mSec(title, inner) {
        return '<div class="amp-msec"><div class="amp-msec-title">'+title+'</div>'+inner+'</div>';
    }
    function buildSocials(a, cls, stop) {
        var sp = stop ? ' onclick="event.stopPropagation()"' : '';
        var links = '';
        if (a.facebook)  links += '<a href="'+esc(a.facebook)+'"  class="'+cls+' amp-soc-fb"   target="_blank" rel="noopener" aria-label="Facebook"'+sp+'><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a>';
        if (a.linkedin)  links += '<a href="'+esc(a.linkedin)+'"  class="'+cls+' amp-soc-li"   target="_blank" rel="noopener" aria-label="LinkedIn"'+sp+'><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg></a>';
        if (a.instagram) links += '<a href="'+esc(a.instagram)+'" class="'+cls+' amp-soc-ig"   target="_blank" rel="noopener" aria-label="Instagram"'+sp+'><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>';
        if (a.twitter)   links += '<a href="'+esc(a.twitter)+'"   class="'+cls+' amp-soc-tw"   target="_blank" rel="noopener" aria-label="Twitter"'+sp+'><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>';
        if (a.youtube)   links += '<a href="'+esc(a.youtube)+'"   class="'+cls+' amp-soc-yt"   target="_blank" rel="noopener" aria-label="YouTube"'+sp+'><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg></a>';
        return links;
    }
    function personSVG() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width=".8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    }

    /* ─── PAGINATION (spans) ─── */
    function renderPager(pages, cur) {
        Pager.empty();
        if (pages <= 1) return;

        Pager.append( pgBtn('← Prev', cur<=1, function(){ goTo(cur-1); }) );

        var nums = [];
        if (pages<=7) { for(var i=1;i<=pages;i++) nums.push(i); }
        else {
            nums=[1];
            if(cur>3) nums.push('…');
            for(var j=Math.max(2,cur-1);j<=Math.min(pages-1,cur+1);j++) nums.push(j);
            if(cur<pages-2) nums.push('…');
            nums.push(pages);
        }
        $.each(nums, function(_,p) {
            if(p==='…') { Pager.append('<span class="amp-pager-dots">…</span>'); return; }
            var $b = pgBtn(p, false, (function(pp){ return function(){ goTo(pp); }; })(p));
            if(p===cur) $b.addClass('active');
            Pager.append($b);
        });

        Pager.append( pgBtn('Next →', cur>=pages, function(){ goTo(cur+1); }) );
    }

    function pgBtn(label, disabled, fn) {
        /* SPAN role="button" — not styled by Elementor Kit */
        var $b = $('<span class="amp-pager-btn'+(disabled?' off':'')+'" role="button" tabindex="'+(disabled?'-1':'0')+'">'+label+'</span>');
        if (!disabled) $b.on('click keypress', function(e){
            if(e.type==='keypress' && e.which!==13 && e.which!==32) return;
            fn();
        });
        return $b;
    }

    function goTo(p) {
        state.paged = p;
        fetch();
        $('html,body').animate({ scrollTop: W.offset().top - 80 }, 300);
    }

    function updateCount(total) {
        var has = state.search||state.featured;
        var txt = has ? (total===1?'1 result found':total+' results found') : 'Showing all '+total+' agents';
        $('#amp-count').text(txt);
        $('#amp-reset').toggleClass('visible', !!has);
    }

    function resetFilters() {
        state.search=''; state.featured='';
        state.orderby=W.data('order')||'menu_order'; state.paged=1;
        $('#amp-search').val('');
        $('#amp-sort').val(state.orderby);
        $('#amp-featured-toggle').prop('checked',false);
        $('#amp-search-clear').removeClass('visible');
        $('#amp-reset').removeClass('visible');
        fetch();
    }

    function showLoading(on) {
        Loader.toggleClass('hidden',!on);
        if(on) G.find('.amp-card,.amp-empty').remove();
    }
    function showError() {
        Loader.addClass('hidden');
        G.find('.amp-card,.amp-empty').remove();
        G.append(emptyState('Something went wrong. Please try again.'));
    }
    function emptyState(msg) {
        return '<div class="amp-empty" role="status"><svg width="52" height="52" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>'+(msg||'No agents found. Try adjusting your filters.')+'</p></div>';
    }
    function esc(s) {
        if(!s) return '';
        return $('<div>').text(String(s)).html();
    }

    $('<style>.amp-noscroll{overflow:hidden!important}</style>').appendTo('head');
    $(document).ready(init);

})(jQuery);
