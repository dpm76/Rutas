'use strict';

dpm.utils = {};

jQuery.fn.exists = function ()
{
    /// <summary>
    /// Tests if an item exists
    /// </summary>
    /// <returns type=""></returns>
    return this.length > 0;
};

Array.prototype.RemoveItem = function (_item)
{
    /// <summary>
    /// Removes an item from an array
    /// </summary>
    /// <param name="_item"></param>

    var index = $.inArray(_item, this);
    if (index != -1)
    {
        this.splice(index, 1);
    }
};

String.prototype.format = function ()
{
    /// <summary>
    /// Function to format strings in a way like .Net does.
    /// Usage: 'Your balance is {0} USD'.format(77.7) 
    /// </summary>
    /// <returns type=""></returns>

    var args = arguments;

    //Check if an array was passed
    if ($.isArray(arguments[0]))
    {
        args = arguments[0];
    }

    var s = this;

    for (var i = 0; i < args.length; i++)
    {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, args[i]);
    }

    return s;
};

//Snippet taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
//String.prototype.startsWith can be already defined in some browsers, since it's defined in ECMAScript 6 specification.
if (!String.prototype.startsWith)
{
    Object.defineProperty(String.prototype, 'startsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function (searchString, position)
        {
            position = position || 0;
            return this.indexOf(searchString, position) === position;
        }
    });
}

dpm.utils.secondsToTimeString = function(seconds)
{
	var hours = Math.floor(seconds / 3600);
	var remSeconds = seconds % 3600;
	
	var minutes = Math.floor(remSeconds / 60);	
	remSeconds = remSeconds % 60;
	
	var hoursSlice = (hours < 10 ? "0" : "") + hours.toString();
	var minutesSlice = (minutes < 10 ? "0" : "" ) + minutes.toString();
	var secondsSlice = (remSeconds < 10 ? "0" : "") + remSeconds.toString(); 
	
	return "{0}:{1}:{2}".format(hoursSlice, minutesSlice, secondsSlice);
};

dpm.utils.prepareForDownloadFile = function(target, filename, text)
{    
	var link = $("#{0}".format(target));
	link.attr("href", "data:application/octet-stream;charset=utf-8," + encodeURIComponent(text));
	link.attr("download", filename);	
};

