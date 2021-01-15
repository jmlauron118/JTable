
# Custom Table for jQuery

*  jQuery JTable v1.0.1.0 - 2021-01-13
*  (c) 2021 Jan Mark Lauron

JTable is a customized table jquery plugin to enhance the accessibility of data object.

## JTable Usage

#### Initialization
```js
$('.div-class').JTable({ parameters });
```

#### Optional configuration parameters
```js
$('.div-class').JTable({ 
   responsive:  false,
   searchable: false,
   drawCallBack: function(){
   },
   initComplete: function(){
   }
});
```
   responsive - enables mobile view.

   searchable - enables filtering of rows.

   drawCallBack - function called in every time the jtable row(s) is being updated.

   initComplete - function called when jtable initialization is done.

#### Required configuration parameters
```js
$('.div-class').JTable({ 
   header: [ list of header ],
   columns: [ list of columns ],
   data: json object
});
```
   header - list of string represents as the header display of the table. 
   ```
   ex:
    header: ['HEADER1','HEADER2',....]
   ```
   columns - initialization parameter allows to define the behavior of individual columns.
   ```
   ex:
   columns: [
     {
      data: 'COLUMN_NAME',
      render: function(data, full){
            // your logic here
            // data - column data value
            // full - all data value
         }
     },
     ...
   ]
   ```
   data - the data (array of object) given in order to display information when jtable is initialized. 
   ```
   ex:
   data: [{ "data": "value"}, ...]
   ```
   

