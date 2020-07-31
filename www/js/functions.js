window.handleOpenURL = function(url) {
    setTimeout(function () {
        try {
            SafariViewController.hide();
        } catch (e) {

        }
        if (url.indexOf(config.idApp + '://?qrcode') !== -1) {
            BarCodeScanner.scan('qrcode');
        } else if (url.indexOf(config.idApp + '://?barcode') !== -1) {
            BarCodeScanner.scan('barcode');
        } else if (url.indexOf(config.idApp + '://?close') !== -1) {

        } else if (url.indexOf(config.idApp + '://?redirect=') !== -1) {
            url = url.split(config.idApp + '://?redirect=');
            if (url[1])
                Factory.$rootScope.location(url[1]);
        } else {
            Factory.ajax(
                {
                    action: 'callback/url',
                    data: {
                        URL: url
                    }
                }
            );
        }
    }, 0);
}

function onErrorUser(_this){
    _this.src = 'img/login_default.png';
}

function onErrorProd(_this){
    _this.src = 'img/market4u.png';
}

function showPassword() {
    $('#showPassword').toggleClass('mdi-action-visibility').toggleClass('mdi-action-visibility-off');
    $('#senha').attr('type', $('#showPassword').hasClass('mdi-action-visibility') ? 'password' : 'text').focus();
}

var setTimeoutClearKeyPress = null;
function inputEvents(_this, _bind) {
    var _this = $(_this);
    clearTimeout(setTimeoutClearKeyPress);
    setTimeoutClearKeyPress = setTimeout(function () {
        var _value = _this.val();
        var _invalid = 0;
        var _type = 1;
        var _verify = 1;
        switch (_this.attr('id')) {
            case 'senha':
                if (_value.length < 8 && _value.length)
                    _invalid = 1;
                break;
            case 'postalcode':
                if (_value.length == 9 && _value.length && _this.attr('value-old') != _value) {
                    $.ajax({
                        url: 'https://viacep.com.br/ws/' + _value.replace('-', '') + '/json/',
                        cache: false,
                        type: 'GET',
                        dataType: 'json',
                        success: function (data) {
                            _this.blur();
                            _this.attr('value-old', _value);
                            if (!data.erro) {
                                $('#street').val(data.logradouro);
                                Factory.$rootScope.usuario.STREET = data.logradouro;
                                $('#district').val(data.bairro);
                                Factory.$rootScope.usuario.DISTRICT = data.bairro;
                                $('#city').val(data.localidade);
                                Factory.$rootScope.usuario.CITY = data.localidade;
                                $('#state').val(data.uf);
                                Factory.$rootScope.usuario.STATE = data.uf;
                            }
                            $('#boxEnderecoCompleto').show();
                        },
                        beforeSend: function () {
                            $('#carregando').css('display', 'flex').css('opacity', 1);
                        },
                        complete: function () {
                            $('#carregando').hide().css('opacity', 0);
                        },
                        error: function () {
                            $('#carregando').hide().css('opacity', 0);
                            $('#boxEnderecoCompleto').show();
                        }
                    });
                }
                break;
            case 'data_nascimento':
                if (_value.length) {
                    if (!isValidDate(_value))
                        _invalid = 1;
                    else if (_value.length < 10)
                        _invalid = 1;
                }
                break;
            case 'cpf':
                if (!validaCpf(_value.substring(0, 14)) && _value.length) {
                    verifyMsg(_verify, 0, _this, 2);
                    _invalid = 1;
                    $('#boxDadosPessoaisCompleto').hide();
                    _this.attr('value-old', _value);
                } else if (_value.length == 14 && _this.attr('value-old') != _value) {
                    Factory.ajax(
                        {
                            action: 'cadastro/cpf',
                            data: {
                                VALUE: _value
                            }
                        },
                        function (data) {
                            _this.blur();
                            _this.attr('value-old', _value);
                            verifyMsg(_verify, data.ja_utilizado ? 1 : 0, _this, 2);
                            if (!data.ja_utilizado) {
                                $('#cpf').val(_value);
                                Factory.$rootScope.usuario.CPF = _value;
                                if (data.NOME) {
                                    $('#nome_completo').val(data.NOME);
                                    Factory.$rootScope.usuario.NOME = data.NOME;
                                }
                                if (data.GENERO) {
                                    $('#genero_' + data.GENERO).attr('checked', true);
                                    Factory.$rootScope.usuario.GENERO = data.GENERO;
                                }
                                if (data.DATA_NASCIMENTO) {
                                    $('#data_nascimento').attr('disabled', true).val(data.DATA_NASCIMENTO);
                                    Factory.$rootScope.usuario.DATA_NASCIMENTO_FORMAT = data.DATA_NASCIMENTO;
                                }
                                $('#boxDadosPessoaisCompleto').show();
                            }
                        }
                    );
                }
                break;
            case 'expirationMonthYear':
                var length = _value.length;
                if (_value.length) {
                    _value = _value.split('/');
                    _value[1] = '20' + _value[1];
                    if (parseInt(_value[0]) > 12 || parseInt(_value[0]) < 1)
                        _invalid = 1;
                    else if (parseInt(_value[1]) < (new Date()).getFullYear())
                        _invalid = 1;
                }
                break;
            case 'numero_celular':
                if (_value.length < 14 && _value.length)
                    _invalid = 1;
                break;
            case 'cardNumber':
                _value = _value.replace(/ /g, '');
                if (_value.length >= 6) {
                    if (Factory.$rootScope.PAGSEGURO_SESSIONID) {
                        PagSeguroDirectPayment.getBrand({
                            cardBin: _value.substring(0, 6),
                            success: function (data) {
                                if (data.brand.name) {
                                    _invalid = 0;
                                    $('#cardBandeira').val(data.brand.name);
                                    $('#imgBandeira').show().attr('src', 'img/bandeira_cc/' + data.brand.name + '.png');
                                } else {
                                    $('#cardBandeira').val('');
                                    $('#imgBandeira').hide();
                                    _invalid = 1;
                                }
                                verifyMsg(_verify, _invalid, _this);
                            },
                            error: function () {
                                verifyMsg(_verify, 1, _this);
                            }
                        });
                    }
                } else {
                    $('#cardBandeira').val('');
                    $('#imgBandeira').hide();
                    _invalid = 0;
                }
                break;
            case 'nome_completo':
                _value = _value.split(' ');
                if (!((_value[0] && _value[1]) || !_value[0]) && _value[0])
                    _invalid = 1;
                break;
            case 'email':
                if (_value.length) {
                    var email = _value.split('@');
                    if (email[0] && email[1]) {
                        Factory.ajax(
                            {
                                action: 'cadastro/verify',
                                data: {
                                    TYPE: 'EMAIL',
                                    VALUE: _value
                                }
                            },
                            function (data) {
                                verifyMsg(_verify, data.ja_utilizado ? 1 : 0, _this, 2);
                            }
                        );
                    }
                } else
                    _type = 2;
                break;
            case 'u_n':
                if (_value.length) {
                    _value = replaceSpecialChars(_value.toLowerCase());
                    _this.val(_value);
                    Factory.ajax(
                        {
                            action: 'cadastro/verify',
                            data: {
                                TYPE: 'USERNAME',
                                VALUE: _value
                            }
                        },
                        function (data) {
                            verifyMsg(_verify, data.ja_utilizado ? 1 : 0, _this, 2);
                        }
                    );
                } else
                    _type = 2;
                break;
            default:
                _verify = 0;
                break;
        }
        verifyMsg(_verify, _invalid, _this, _type);
    }, _bind == 'blur' ? 0 : 1000);
}

function verifyMsg(_verify, _invalid, _this, type) {
    if (_verify) {
        if (_invalid)
            _this.addClass('ng-invalid' + (type == 2 ? '2' : ''));
        else
            _this.removeClass('ng-invalid' + (type == 2 ? '2' : ''));

        _this.closest('form').attr('invalid', _this.closest('form').find('input.ng-invalid').length || _this.closest('form').find('input.ng-invalid2').length ? 1 : 0);
    }
}

function replaceSpecialChars(str) {
    var $spaceSymbol = '';
    var regex;
    var returnString = str;
    var specialChars = [
        {val:"a",let:"áàãâä"},
        {val:"e",let:"éèêë"},
        {val:"i",let:"íìîï"},
        {val:"o",let:"óòõôö"},
        {val:"u",let:"úùûü"},
        {val:"c",let:"ç"},
        {val:"A",let:"ÁÀÃÂÄ"},
        {val:"E",let:"ÉÈÊË"},
        {val:"I",let:"ÍÌÎÏ"},
        {val:"O",let:"ÓÒÕÔÖ"},
        {val:"U",let:"ÚÙÛÜ"},
        {val:"C",let:"Ç"},
        {val:"",let:"?!()"}
    ]
    for (var i = 0; i < specialChars.length; i++) {
        regex = new RegExp("["+specialChars[i].let+"]", "g");
        returnString = returnString.replace(regex, specialChars[i].val);
        regex = null;
    }

    var sourceString = returnString.replace(/\s/g,$spaceSymbol);

    return sourceString.replace(/[` ´~!@#$%^&*()|_+\-=?;:¨'",.<>\{\}\[\]\\\/]/gi, '');
};

function isValidDate(data) {
    var regex = "\\d{2}/\\d{2}/\\d{4}";
    var dtArray = data.split("/");

    if (dtArray == null)
        return false;

    // Checks for dd/mm/yyyy format.
    var dtDay = dtArray[0];
    var dtMonth = dtArray[1];
    var dtYear = dtArray[2];

    if (dtMonth < 1 || dtMonth > 12)
        return false;
    else if (dtDay < 1 || dtDay > 31)
        return false;
    else if (dtYear > (new Date()).getFullYear() || dtYear <= ((new Date()).getFullYear() - 100))
        return false;
    else if ((dtMonth == 4 || dtMonth == 6 || dtMonth == 9 || dtMonth == 11) && dtDay == 31)
        return false;
    else if (dtMonth == 2) {
        var isleap = (dtYear % 4 == 0 && (dtYear % 100 != 0 || dtYear % 400 == 0));
        if (dtDay > 29 || (dtDay == 29 && !isleap))
            return false;
    }
    return true;
}

function validaCpf(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.toString().length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    var result = true;
    [9, 10].forEach(function (j) {
        var soma = 0, r;
        cpf.split(/(?=)/).splice(0, j).forEach(function (e, i) {
            soma += parseInt(e) * ((j + 2) - (i + 1));
        });
        r = soma % 11;
        r = (r < 2) ? 0 : 11 - r;
        if (r != cpf.substring(j, j + 1)) result = false;
    });
    return result;
}

var mask = function(element, mask, length) {
    try {
        function inputHandler(masks, max, event) {
            var c = event.target;
            var v = c.value.replace(/\D/g, '');
            var m = c.value.length > max ? 1 : 0;
            VMasker(c).unMask();
            VMasker(c).maskPattern(masks[m]);
            c.value = VMasker.toPattern(v, masks[m]);
        }

        var element = document.querySelector(element);
        VMasker(element).maskPattern(mask[0]);
        if (mask[1])
            element.addEventListener('input', inputHandler.bind(undefined, mask, length), false);
    } catch (e) {

    }
};