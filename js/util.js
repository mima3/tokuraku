/**
 * ユーティリティ関数
 */
var util = (function() {
  /**
   * AjaxでJSONを取得する
   * @param {string} url  実行URL
   * @param {Array} data パラメータ用のデータ
   * @param {function} callbackFunc データ取得時のコールバック関数
   * @param {function} beforesendFunc 処理開始前のコールバック関数
   * @param {function} completeFunc 処理終了時のコールバック関数
  **/
  function _getJson(url, data, callbackFunc, beforesendFunc, completeFunc) {
    $.ajax({
      url: url,
      type: 'GET',
      cache: false,
      dataType: 'json',
      data: data,
      timeout: 30000,
      mimeType: 'application/json;charset=utf-8',
      // 送信前
      beforeSend: beforesendFunc,
      // 応答後
      complete: completeFunc,

      // 通信成功時の処理
      success: function(result, textStatus, xhr) {
        callbackFunc(0, result);
      },

      // 通信失敗時の処理
      error: function(xhr, textStatus, error) {
        if (!error) {
          error = 'ConnectError';
        }
        console.log(error);
        callbackFunc(error, {});
      }
    });
  }

  /**
   * クエリーパラメータを配列で取得
   * @return {Array} クエリパラメータの配列
   */
  function _getQueryParam() {
    var qsParm = new Array();

    var query = window.location.search.substring(1);
    var parms = query.split('&');
    for (var i = 0; i < parms.length; i++) {
      var pos = parms[i].indexOf('=');
      if (pos > 0) {
        var key = parms[i].substring(0, pos);
        var val = parms[i].substring(pos + 1);
        qsParm[key] = val;
      }
    }
    return qsParm;
  }


  var formatRegExp = /%[sdj%]/g;
  function _format(f) {
    if (!_isString(f)) {
      var objects = [];
      for (var i = 0; i < arguments.length; i++) {
        objects.push(arguments[i]);
      }
      return objects.join(' ');
    }

    var i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(formatRegExp, function(x) {
      if (x === '%%') return '%';
      if (i >= len) return x;
      switch (x) {
        case '%s': return String(args[i++]);
        case '%d': return Number(args[i++]);
        case '%j':
          try {
            return JSON.stringify(args[i++]);
          } catch (_) {
            return '[Circular]';
          }
        default:
          return x;
      }
    });
    for (var x = args[i]; i < len; x = args[++i]) {
      if (isNull(x) || !isObject(x)) {
        str += ' ' + x;
      } else {
        str += ' ' + inspect(x);
      }
    }
    return str;
  }

  function _isObject(arg) {
    return typeof arg === 'object' && arg !== null;
  }

  function _isNull(arg) {
    return arg === null;
  }

  function _isString(arg) {
    return typeof arg === 'string';
  }

  function _isUndefined(arg) {
    return arg === void 0;
  }

  function _numberSeparator(x) {
    return String(x).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,' );
  }

  return {
    getJson: _getJson,
    getQueryParam: _getQueryParam,
    format: _format,
    numberSeparator: _numberSeparator
  };
})();
