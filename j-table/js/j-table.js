;(function ($, window, document,undefined){
    var pluginName = 'JTable';

    function JMTable (element, options){
        this._element = element;
        this._name = pluginName;
        this._defaults = $.fn.JTable.defaults;
        this._colWidth = (100 / options.header.length) +'%';
        this._options = $.extend( {}, this._defaults, options );
        this.isMobile = false;
        this.elementId = element.id;
        this._jTableId = '#'+element.id;
        this._timeout;

        this.data = options.data;
        this.header = options.header;
        this.columns = options.columns;
        this.searchable = options.searchable;
        this.responsive = options.responsive;
        this.drawCallBack = options.drawCallBack;
        this.initComplete = options.initComplete;

        this.init();
    }

    $.extend(JMTable.prototype,{
        init: function () {
            InitJTable(this);
            this.initComplete();
            this.buildCache();
        },
        destroy: function(){
            this.unbindEvents();
            this.$element.removeData();
            this.$element.children().remove();
        },
        buildCache: function () {
            this.$element = $(this._element);
        },
        unbindEvents: function(){
            // this.$element.off('.'+this._name);
            this.$element.find('*').off();
        }
    });

    $.fn.JTable = function(options){
        var jTableObject = null;

        this.each(function(){
            if(!$.data(this, "plugin_" + pluginName)){
                $.data(this, "plugin_" + pluginName, new JMTable(this, options));
            }
            else{
                jTableObject = $.data(this, "plugin_" + pluginName);
            }
        });

        this.rows = function(){
            var $rows = this.rows;

            $rows[0] = this.find('.jdata');
            $rows.data = function(){
                return jTableObject.data;
            }

            return $rows;
        }

        this.row = function(rowElem){
            var $row = this.row;
            
            if(rowElem != null){
                $row[0] = rowElem;

                $row.data = function(newData){
                    var $data = $row.data;

                    if(newData == null){
                        return $(rowElem).data('data');
                    }
                    else{
                        $data.draw = function(){
                            $.each(jTableObject.data, function (i, val) {
                                if (val == $(rowElem).data('data')) {
                                    jTableObject.data[i] = newData;
    
                                    return false;
                                }
                            });

                            $(rowElem).data('data', newData);
                            InitJTable(jTableObject);

                            return $data.draw;
                        }
                    }

                    return $data;
                }
            }
            else{
                throw 'JTable Warning! Row element is missing.';
            }

            return $row;
        }

        this.destroy = function(){
            jTableObject.destroy();

            return this;
        }

        this.search = function(value){
            var $search = this.search;

            $search.draw = function(){
                FilterRow(value || '', jTableObject);
            }

            return $search;
        }

        return this;
    }

    $.fn.JTable.defaults = {
        initComplete: null
    };

    function InitJTable(property){
        JPopulateList(property);

        if (property.searchable != undefined && property.searchable) {
            $('.j-search-content.' + property.elementId).remove();
            $(property._jTableId).prepend('<div class="j-search-content ' + property.elementId + '"> <input id="j-search" type="search" class="form-control form-control-sm" placeholder="Search"></div>');
            SearchEvent(property);

            if (property.isMobile) {
                $('.' + property.elementId + ' > #j-search').css('width', '60%');
            }
            else {
                $('.' + property.elementId + ' > #j-search').css('width', '30%');
            }
        }

        $(window).resize(function () {
            JPopulateList(property);

            if (property.isMobile) {
                $('.' + property.elementId + ' > #j-search').css('width', '60%');
            }
            else {
                $('.' + property.elementId + ' > #j-search').css('width', '30%');
            }
        });
    }

    function JPopulateList(property){
        if (property.responsive) {
            if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())) {
                JTableMobile(property);
            }
            else {
                if ($(window).width() <= 1050) {
                    JTableMobile(property);
                }
                else {
                    JTableWeb(property);
                }
            }
        }
        else {
            JTableWeb(property);
        }
    }

    function JTableWeb(property){
        var _header = property.header;
        var _columns = property.columns;
        var htmlString = '';
        property.isMobile = false;

        if (_header.length == _columns.length) {
            //headers
            for (i = 0; i < _header.length; i++) {
                htmlString += `<div class="j-header" style="width: ${property._colWidth}"><label>${_header[i]}</label></div>`;
            }

            $(property._jTableId).find('.jmain.' + property.elementId).remove();
            $(property._jTableId).append('<div class="jmain jmain-container ' + property.elementId + '"></div>');
            $(property._jTableId + ' > .jmain-container.' + property.elementId).append(`<div class="jheader-container">${htmlString}</div>`);
            $(property._jTableId).data('data', JSON.stringify(property.data));

            //rows
            if (property.data == null || property.data == undefined || property.data == '') {
                $(property._jTableId + ' > .jmain-container.' + property.elementId).append(`<div class="jrow-container jno-data"><label>No data available in table</label></div>`);
            }
            else {
                for (j = 0; j < property.data.length; j++) {
                    htmlString = '';

                    for (k = 0; k < _columns.length; k++) {
                        var renderRet = '';

                        if (typeof _columns[k].render == 'function') {
                            renderRet = _columns[k].render(property.data[j][_columns[k].data], property.data[j]);
                        }
                        else {
                            renderRet = '';
                        }

                        htmlString += `<div class="j-row" style="width: ${property._colWidth}"><label>${renderRet == '' ? property.data[j][_columns[k].data] : renderRet}</label></div>`;
                    }

                    $(property._jTableId + ' > .jmain-container.' + property.elementId).append(`<div id="${property.elementId}-tr${(j + 1)}" class="jrow-content jdata"><div class="jrow-container">${htmlString}</div></div>`);
                    $('#'+property.elementId+'-tr'+(j + 1)).data('data', property.data[j]);

                    if (typeof property.drawCallBack != 'undefined') {
                        property.drawCallBack();
                    }
                }
            }
        } else {
            alert('JTable Warning! Header(s) and Column(s) does not match. ');
        }
    }

    function JTableMobile(property){
        var _header = property.header;
        var _columns = property.columns;
        var htmlString = '';

        property.isMobile = true;

        if (_header.length == _columns.length) {
            $(property._jTableId).find('.jmain.' + property.elementId).remove();
            $(property._jTableId).data('data', JSON.stringify(property.data));

            if (property.data == null || property.data == undefined || property.data == '') {
                $(property._jTableId).append(`<div class="jrow-container jno-data-m"><label>No data available in table</label></div>`);
            }
            else {
                $(property._jTableId).append('<div class="jmain ' + property.elementId + ' jmain-container-m "></div>');

                for (j = 0; j < property.data.length; j++) {
                    htmlString = '';

                    for (k = 0; k < _columns.length; k++) {
                        var renderRet = '';

                        try {
                            renderRet = _columns[k].render(property.data[j][_columns[k].data], property.data[j]);
                        }
                        catch {
                            renderRet = '';
                        }

                        htmlString += `<div class="j-row-m">
                                        <div><strong>${_header[k]}:</strong></div>
                                        <div>${renderRet == '' ? property.data[j][_columns[k].data] : renderRet}</div>
                                    </div>`;
                    }

                    $(property._jTableId + ' > .jmain-container-m.' + property.elementId).append(`<div id="${property.elementId}-tr${j + 1}" class="jrow-content-m jdata"><div class="jrow-container-m">${htmlString}</div></div>`);
                    $('#'+property.elementId+'-tr' + (j + 1)).data('data', property.data[j]);

                    if (typeof property.drawCallBack != 'undefined') {
                        property.drawCallBack();
                    }
                }
            }
        } else {
            alert('JTable Warning! Header(s) and Column(s) does not match. ');
        }

        // if (typeof property.initComplete != 'undefined') {
        //     property.initComplete();
        // }
    }

    function SearchEvent(property){
        $(property._jTableId).find('input[id="j-search"]').unbind('change paste keyup').bind('change paste keyup', function () {
            clearTimeout(property._timeout);
            property._timeout = setTimeout(()=>{
                FilterRow($(this).val(), property);
            }, 250);
        });
    }

    function FilterRow(searchValue, property){
        var divParent = $('.jmain.'+property.elementId);
        var child = divParent.find('.jdata');
        var counter = 0;

        divParent.find('.jno-data').remove();

        for (i = 0; i < child.length; i++){
            var a = child[i];
            var txtValue = a.textContent || a.innerText;

            if (txtValue.toUpperCase().indexOf(searchValue.toUpperCase()) > -1) {
                child[i].style.display = "";
            } else {
                child[i].style.display = "none";
                counter += 1;
            }

            if (i == (child.length - 1) && counter == child.length) {
                if (property.isMobile) {
                    $(property._jTableId + ' > .jmain-container-m.' + property.elementId).append(`<div class="jrow-container jno-data"><label>'${searchValue}' is not found!</label></div>`);
                }
                else {
                    $(property._jTableId + ' > .jmain-container.' + property.elementId).append(`<div class="jrow-container jno-data"><label>'${searchValue}' is not found!</label></div>`);
                }
            }
        }
    }

})( jQuery, window, document );