angular.module('orderCloud')
    .factory('CupsUtility', CupsUtilityFactory)
;

function CupsUtilityFactory($q, $exceptionHandler){

    var service = {
        ListAll: _listAll
    };

    function _listAll() {
        /*
         *   recursively iterates over any list function
         *
         *   first parameter must be the list function
         *   parameters thereafter are arguments to the list function
         *   one of those arguments must be the string 'page'
         *   which defines the position of the page parameter to the list function
         *
         *   Example: _listAll(OrderCloud.Categories.List, null, 'page', 100, null, null, null, 'all', 'mockCatalogID')
         *   Equivalent to:  OrderCloud.Categories.List(null, 'page', 100, null, null, null, 'all', 'mockCatalogID')
         *
         **/

        //validation
        var invalid  = false;
        var args = [].slice.call(arguments);
        var ListFn = args.splice(0, 1)[0];
        if(typeof ListFn !== 'function') {$exceptionHandler('The first parameter must be a list function'); invalid = true;}
        var index = args.indexOf('page');
        if(index < 0) {$exceptionHandler('at least one parameter must be the string "page" that defines the position of the page parameter for your list function'); invalid = true;}
        if(invalid) return;

        var queue = [];
        var listItems;
        args.splice(index, 1, 1); //set page to 1

        return ListFn.apply(null, args)
            .then(function (data) {
                listItems = data;
                if (data.Meta.TotalPages > data.Meta.Page) {
                    var page = data.Meta.Page;
                    while (page < data.Meta.TotalPages) {
                        page += 1;
                        args.splice(index, 1, page); //set page to variable page;
                        queue.push(ListFn.apply(null, args));
                    }
                }
                return $q.all(queue)
                    .then(function (results) {
                        _.each(results, function (result) {
                            listItems.Items = [].concat(listItems.Items, result.Items);
                            listItems.Meta = result.Meta;
                        });
                        return listItems;
                    })
                    .catch(function(ex){
                        $exceptionHandler(ex);
                    })
            });
    }

    return service;
}