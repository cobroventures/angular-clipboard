(function (root, factory) {
    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['angular'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('angular'));
    } else {
        root.angularClipboard = factory(root.angular);
  }
}(this, function (angular) {

return angular.module('angular-clipboard', [])
    .factory('clipboard', ['$document', '$window', function ($document, $window) {
        function createNode(text) {
            var node = $document[0].createElement('textarea');
            node.style.position = 'absolute';
            node.style.fontSize = '12pt';
            node.style.border = '0';
            node.style.padding = '0';
            node.style.margin = '0';
            node.style.left = '-10000px';
            node.style.top = ($window.pageYOffset || $document[0].documentElement.scrollTop) + 'px';
            node.textContent = text;
            return node;
        }

        function copyNode(node, options) {
            try {
                // Set inline style to override css styles
                $document[0].body.style.webkitUserSelect = 'initial';

                var selection = $document[0].getSelection();
                selection.removeAllRanges();

                var range = document.createRange();
                range.selectNodeContents(node);
                selection.addRange(range);
                // This makes it work in all desktop browsers (Chrome)
                node.select();
                // This makes it work on Mobile Safari
                node.setSelectionRange(0, 999999);

                // By default, this directive copies only to 'text/plain'.
                // We want to set the text/uri-list as well so that programs
                // such as apple mail recognize the link as a URL.
                function copyEventListener($event) {
                  if ($event.preventDefault) {
                    $event.preventDefault();
                  }

                  if (options && options.copyAsUrl) {
                    // If set to true, we set the text/uri-list in the
                    // clipboard data.
                    $event.clipboardData.setData('text/uri-list', node.textContent);
                  }

                  $event.clipboardData.setData('text/plain', node.textContent);
               }

                try {
                    $document[0].addEventListener('copy', copyEventListener);
                    if(!$document[0].execCommand('copy')) {
                        throw('failure copy');
                    }
                } finally {
                    selection.removeAllRanges();
                    $document[0].removeEventListener('copy', copyEventListener);
                }
            } finally {
                // Reset inline style
                $document[0].body.style.webkitUserSelect = '';
            }
        }

        // Options are passed in here, currently, available options are:
        // 1. copyAsUrl - If set to true, we set the text/uri-list in the
        // clipboard data
        function copyText(text, options) {
            var left = $window.pageXOffset || $document[0].documentElement.scrollLeft;
            var top = $window.pageYOffset || $document[0].documentElement.scrollTop;

            var node = createNode(text);
            $document[0].body.appendChild(node);
            copyNode(node, options);

            $window.scrollTo(left, top);
            $document[0].body.removeChild(node);
        }

        return {
            copyText: copyText,
            supported: 'queryCommandSupported' in $document[0] && $document[0].queryCommandSupported('copy')
        };
    }])
    .directive('clipboard', ['clipboard', function (clipboard) {
        return {
            restrict: 'A',
            scope: {
                onCopied: '&',
                onError: '&',
                text: '=',
                supported: '=?'
            },
            link: function (scope, element) {
                scope.supported = clipboard.supported;

                element.on('click', function (event) {
                    try {
                        clipboard.copyText(scope.text, element[0]);
                        if (angular.isFunction(scope.onCopied)) {
                            scope.$evalAsync(scope.onCopied());
                        }
                    } catch (err) {
                        if (angular.isFunction(scope.onError)) {
                            scope.$evalAsync(scope.onError({err: err}));
                        }
                    }
                });
            }
        };
    }]);

}));
