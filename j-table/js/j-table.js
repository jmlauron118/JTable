/*!
 *  JTable v1.0.1.1 - 2021-04-30
 *  (c) 2021 Jan Mark Lauron
 */

; (function ($, window, document, undefined) {
    var pluginName = 'JTable';

    $.fn.JTable = function (options) {
        var jTableObject = null;
        var $jtable = this;

        this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new JMTable(this, options));
            }
            else {
                jTableObject = $.data(this, "plugin_" + pluginName);
            }
        });

        $jtable.rows = function () {
            var $rows = $jtable.rows;

            $rows[0] = $jtable.find('.jdata');
            $rows.data = function () {
                return jTableObject == null ? $.data($jtable[0], 'plugin_JTable').data : jTableObject.data;
            }

            return $rows;
        }

        $jtable.row = function (rowElem) {
            var $row = $jtable.row;

            if (rowElem != null) {
                $row[0] = rowElem;

                $row.data = function (newData) {
                    var $data = $row.data;

                    if (newData == null) {
                        return $(rowElem).data('data');
                    }
                    else {
                        $data.draw = function () {
                            var $jdata = jTableObject == null ? $.data($jtable[0], 'plugin_' + pluginName) : jTableObject;

                            $.each($jdata.data, function (i, val) {
                                if (val == $(rowElem).data('data')) {
                                    $jdata.data[i] = newData;

                                    return false;
                                }
                            });

                            $(rowElem).data('data', newData);
                            InitJTable($jdata);

                            return $data.draw;
                        }
                    }

                    return $data;
                }
            }
            else {
                throw 'JTable Warning! Row element is missing.';
            }

            return $row;
        }

        $jtable.destroy = function () {
            var $destroy = $jtable.destroy;

            if (jTableObject != null) {
                jTableObject.destroy();
            }
            else {
                if ($($jtable).find('.jdata').length > 0) {
                    $.data($jtable[0], 'plugin_' + pluginName).destroy();
                }
                else {
                    alert('JTable Warning! Element is not initialized as JTable or it\'s already been destroyed.');
                }
            }

            return $destroy;
        }

        $jtable.search = function (value) {
            var $search = $jtable.search;

            $search.draw = function () {
                var $jdata = jTableObject == null ? $.data($jtable[0], 'plugin_' + pluginName) : jTableObject;

                FilterRow(value || '', $jdata);
            }

            return $search;
        }

        return $jtable;
    }

    function JMTable(element, options) {
        this._element = element;
        this._name = pluginName;
        this._defaults = $.fn.JTable.defaults;
        this._options = $.extend({}, this._defaults, options);
        this.isMobile = false;
        this.elementId = element.id;
        this._jTableId = '#' + element.id;
        this._timeout;
        this.border_color = $(element).data('border') || '';

        if (typeof options != 'undefined') {
            this._colWidth = (100 / options.header.length) + '%';
            this.data = options.data;
            this.header = options.header;
            this.columns = options.columns;
            this.searchable = options.searchable;
            this.responsive = options.responsive;
            this.drawCallBack = options.drawCallBack;
            this.initComplete = options.initComplete;

            this.init();
        }

        this.buildCache();
    }

    $.extend(JMTable.prototype, {
        init: function () {
            InitJTable(this);
            this.initComplete();
        },
        destroy: function () {
            this.unbindEvents();
            this.$element.removeData();
            this.$element.children().remove();
            $.data(this.$element, 'plugin_' + pluginName, null);
        },
        buildCache: function () {
            this.$element = $(this._element);
        },
        unbindEvents: function () {
            if (typeof this.$element != 'undefined') {
                this.$element.find('*').off();
            }
        }
    });

    $.fn.JTable.defaults = {
        initComplete: null
    };

    function InitJTable(property) {
        JPopulateList(property);

        if (property.searchable != undefined && property.searchable) {
            $('.j-search-content.' + property.elementId).remove();
            $(property._jTableId).prepend('<div class="j-search-content ' + property.elementId + '"> <input id="j-search" type="search" placeholder="Search"></div>');
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

    function JPopulateList(property) {
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

    function JTableWeb(property) {
        var _header = property.header;
        var _columns = property.columns;
        var htmlString = '';
        property.isMobile = false;

        if (_header.length == _columns.length) {
            //headers
            for (i = 0; i < _header.length; i++) {
                htmlString += `<div class="j-header ${property.border_color != '' ? property.border_color+'-head': ''}" style="width: ${property._colWidth}"><label>${_header[i]}</label></div>`;
            }

            $(property._jTableId).find('.jmain.' + property.elementId).remove();
            $(property._jTableId).append(`<div class="jmain jmain-container ${property.border_color != '' ? property.border_color: ''} ${property.elementId}"></div>`);
            $(property._jTableId + ' > .jmain-container.' + property.elementId).append(`<div class="jheader-container">${htmlString}</div>`);
            $(property._jTableId + ' > .jmain-container.' + property.elementId).append(`<div class="jrow-container"></div>`);
            $(property._jTableId).data('data', JSON.stringify(property.data));

            //rows
            if (property.data == null || property.data == undefined || property.data == '') {
                $(property._jTableId + ' > .jmain-container.' + property.elementId +' > .jrow-container').append(`<div class="jno-data ${property.border_color != '' ? property.border_color+'-head': ''}"><label>No data available in table</label></div>`);
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

                    $(property._jTableId + ' > .jmain-container.' + property.elementId+' > .jrow-container').append(`<div id="${property.elementId}-tr${(j + 1)}" class="jrow-content jdata ${property.border_color != '' ? property.border_color: ''}">${htmlString}</div>`);
                    $('#' + property.elementId + '-tr' + (j + 1)).data('data', property.data[j]);

                    if (typeof property.drawCallBack != 'undefined') {
                        property.drawCallBack();
                    }
                }
            }
        } else {
            alert('JTable Warning! Header(s) and Column(s) does not match. ');
        }
    }

    function JTableMobile(property) {
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
                    $('#' + property.elementId + '-tr' + (j + 1)).data('data', property.data[j]);

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

    function SearchEvent(property) {
        $(property._jTableId).find('input[id="j-search"]').unbind('change paste keyup').bind('change paste keyup', function () {
            clearTimeout(property._timeout);
            property._timeout = setTimeout(() => {
                FilterRow($(this).val(), property);
            }, 250);
        });
    }

    function FilterRow(searchValue, property) {
        var divParent = $('.jmain.' + property.elementId);
        var child = divParent.find('.jdata');
        var counter = 0;

        divParent.find('.jno-data').remove();

        for (i = 0; i < child.length; i++) {
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

})(jQuery, window, document);