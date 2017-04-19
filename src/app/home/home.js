angular.module('orderCloud')
    .config(HomeConfig)
    .controller('HomeCtrl', HomeController);

function HomeConfig($stateProvider) {
    $stateProvider
        .state('home', {
            parent: 'base',
            url: '/home',
            templateUrl: 'home/templates/home.tpl.html',
            controller: 'HomeCtrl',
            controllerAs: 'home',
            data: {
                pageTitle: 'Home'
            },
            resolve: {
                FeaturedProducts: function(OrderCloud) {
                    return OrderCloud.Me.ListProducts(null, null, 100, null, null, {
                        'xp.Featured': true
                    });
                },
                FeaturedCategories: function(OrderCloud) {
                    return OrderCloud.Me.ListCategories(null, 1, 100, null, null, {
                        'xp.Featured': true
                    }, 'all');
                }
            }
        });
}

function HomeController($q, FeaturedProducts, FeaturedCategories, toastr, OrderCloud, CupsUtility) {
    var vm = this;
    vm.productList = FeaturedProducts;
    vm.categoryList = FeaturedCategories;

    //settings used by slider
    vm.responsive = [{
            breakpoint: 1500,
            settings: {
                slidesToShow: 4
            }
        },
        {
            breakpoint: 992,
            settings: {
                slidesToShow: 3
            }
        },
        {
            breakpoint: 768,
            settings: {
                slidesToShow: 1
            }
        }
    ];

    vm.test = _deepCategoryAssignment;

    function _deepCategoryAssignment() {
        return CupsUtility.ListAll(OrderCloud.Me.ListCategories, null, 'page', 100, null, null, null, 'all', 'caferio')
            .then(function(categoryList) {
				var fullCatList = angular.copy(categoryList.Items);
                return checkCategory(categoryList.Items, fullCatList);
            });
    }
	vm.errors = [];

    function checkCategory(categories, fullCatList) {
        var category = categories.pop();
        if (category && category.ParentID) {
            return OrderCloud.Categories.ListProductAssignments(category.ID, null, null, 100)
                .then(function(assignmentList) {
					var assignedProducts = _.pluck(assignmentList.Items, 'ProductID');
					assignToParentCat(category, assignedProducts, categories, fullCatList);
					}
				);
        } else {
            if (categories.length) {
                return checkCategory(categories, fullCatList);
            } else {
                return finish(vm.errors.join('\n'));
            }
        }
    }

	function assignToParentCat(category, assignedProducts, remainingCategories, fullCatList){
		return OrderCloud.Me.ListProducts(null, null, 100, null, null, {CategoryID: category.ParentID})
			.then(function(productList) {
				var products = _.pluck(productList.Items, 'ID');
				var parentCat = _.findWhere(fullCatList, {ID: category.ParentID});
				var productsToAssign = _.difference(products, assignedProducts);

				if(!productsToAssign && !parentCat && remainingCategories.length) return checkCategory(remainingCategories, fullCatList);
				if(!productsToAssign && !parentCat && !remainingCategories.length) return finish();
				
				var assignmentQueue = [];
				_.each(productsToAssign, function(pID) {
					assignmentQueue.push(function() {
						return OrderCloud.Categories.SaveProductAssignment({CategoryID: category.ID, ProductID: pID}, 'catalogid')
							.catch(function() {
								vm.errors.push({ProductID: pID, CategoryID: category.ID});
								console.log('ProductID: ' + pID + ', CategoryID:' + category.ID);
							});
					}());
				});
				return $q.all(assignmentQueue)
					.then(function() {
						if (parentCat) {
							return assignToParentCat(parentCat, assignedProducts, remainingCategories, fullCatList);
						}
						else if(remainingCategories.length){
							checkCategory(remainingCategories, fullCatList);
						} else {
							return finish(vm.errors.join('\n'));
						}
					});
			});
	}

    function finish() {
        toastr.success('Finished', 'Success');
    }
}