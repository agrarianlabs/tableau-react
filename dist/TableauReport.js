'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _es6Promise = require('es6-promise');

var _shallowequal = require('shallowequal');

var _shallowequal2 = _interopRequireDefault(_shallowequal);

var _tokenizeUrl = require('./tokenizeUrl');

var _tokenizeUrl2 = _interopRequireDefault(_tokenizeUrl);

var _tableauApi = require('./tableauApi');

var _tableauApi2 = _interopRequireDefault(_tableauApi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var propTypes = {
  filters: _react.PropTypes.object,
  url: _react.PropTypes.string,
  parameters: _react.PropTypes.object,
  options: _react.PropTypes.object,
  token: _react.PropTypes.string
};

var defaultProps = {
  loading: false,
  parameters: {},
  filters: {},
  options: {}
};

var TableauReport = function (_React$Component) {
  _inherits(TableauReport, _React$Component);

  function TableauReport(props) {
    _classCallCheck(this, TableauReport);

    var _this = _possibleConstructorReturn(this, (TableauReport.__proto__ || Object.getPrototypeOf(TableauReport)).call(this, props));

    _this.state = {
      filters: props.filters,
      parameters: props.parameters
    };
    return _this;
  }

  _createClass(TableauReport, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.initTableau();
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var isReportChanged = nextProps.url !== this.props.url;
      var isFiltersChanged = !(0, _shallowequal2.default)(this.props.filters, nextProps.filters, this.compareArrays);
      var isParametersChanged = !(0, _shallowequal2.default)(this.props.parameters, nextProps.parameters);
      var isLoading = this.state.loading;

      // Only report is changed - re-initialize
      if (isReportChanged) {
        this.initTableau();
      }

      // Only filters are changed, apply via the API
      if (!isReportChanged && isFiltersChanged && !isLoading) {
        this.applyFilters(nextProps.filters);
      }

      // Only parameters are changed, apply via the API
      if (!isReportChanged && isParametersChanged && !isLoading) {
        this.applyParameters(nextProps.parameters);
      }

      // token change, validate it.
      if (nextProps.token !== this.props.token) {
        this.setState({ didInvalidateToken: false });
      }
    }

    /**
     * Compares the values of filters to see if they are the same.
     * @param  {Array<Number>} a
     * @param  {Array<Number>} b
     * @return {Boolean}
     */

  }, {
    key: 'compareArrays',
    value: function compareArrays(a, b) {
      if (Array.isArray(a) && Array.isArray(b)) {
        return a.sort().toString() === b.sort().toString();
      }

      return undefined;
    }

    /**
     * Execute a callback when an array of promises complete, regardless of
     * whether any throw an error.
     */

  }, {
    key: 'onComplete',
    value: function onComplete(promises, cb) {
      _es6Promise.Promise.all(promises).then(function () {
        return cb();
      }, function () {
        return cb();
      });
    }

    /**
     * Returns a vizUrl, tokenizing it if a token is passed and immediately
     * invalidating it to prevent it from being used more than once.
     */

  }, {
    key: 'getUrl',
    value: function getUrl() {
      var token = this.props.token;

      var parsed = _url2.default.parse(this.props.url, true);
      var query = '?:embed=yes&:comments=no&:toolbar=yes&:refresh=yes';

      if (!this.state.didInvalidateToken && token) {
        this.invalidateToken();
        return (0, _tokenizeUrl2.default)(this.props.url, token) + query;
      }

      return parsed.protocol + '//' + parsed.host + parsed.pathname + query;
    }
  }, {
    key: 'invalidateToken',
    value: function invalidateToken() {
      this.setState({ didInvalidateToken: true });
    }

    /**
     * Asynchronously applies filters to the worksheet, excluding those that have
     * already been applied, which is determined by checking against state.
     * @param  {Object} filters
     * @return {void}
     */

  }, {
    key: 'applyFilters',
    value: function applyFilters(filters) {
      var _this2 = this;

      var REPLACE = _tableauApi2.default.FilterUpdateType.REPLACE;
      var promises = [];

      this.setState({ loading: true });

      for (var key in filters) {
        if (!this.state.filters.hasOwnProperty(key) || !this.compareArrays(this.state.filters[key], filters[key])) {
          promises.push(this.sheet.applyFilterAsync(key, filters[key], REPLACE));
        }
      }

      this.onComplete(promises, function () {
        return _this2.setState({ loading: false, filters: filters });
      });
    }
  }, {
    key: 'applyParameters',
    value: function applyParameters(parameters) {
      var _this3 = this;

      var promises = [];

      for (var key in parameters) {
        if (!this.state.parameters.hasOwnProperty(key) || this.state.parameters[key] !== parameters[key]) {
          var val = parameters[key];
          promises.push(this.workbook.changeParameterValueAsync(key, val));
        }
      }

      this.onComplete(promises, function () {
        return _this3.setState({ loading: false, parameters: parameters });
      });
    }

    /**
     * Initialize the viz via the Tableau JS API.
     * @return {void}
     */

  }, {
    key: 'initTableau',
    value: function initTableau() {
      var _this4 = this;

      var _props = this.props,
          filters = _props.filters,
          parameters = _props.parameters;

      var vizUrl = this.getUrl();

      var options = _extends({}, filters, parameters, this.props.options, {
        onFirstInteractive: function onFirstInteractive() {
          _this4.workbook = _this4.viz.getWorkbook();
          _this4.sheets = _this4.workbook.getActiveSheet().getWorksheets();
          _this4.sheet = _this4.sheets[0];

          _this4.props.onLoad(new Date());
        }
      });

      // cleanup
      if (this.viz) {
        this.viz.dispose();
        this.viz = null;
      }

      this.viz = new _tableauApi2.default.Viz(this.container, vizUrl, options);
    }
  }, {
    key: 'render',
    value: function render() {
      var _this5 = this;

      return _react2.default.createElement('div', { ref: function ref(c) {
          return _this5.container = c;
        } });
    }
  }]);

  return TableauReport;
}(_react2.default.Component);

TableauReport.propTypes = propTypes;
TableauReport.defaultProps = defaultProps;

exports.default = TableauReport;
module.exports = exports['default'];