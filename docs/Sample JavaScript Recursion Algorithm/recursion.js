/*!
calcNames 1.1 (01/15/2018), compute the Name and Description property values for a DOM node
Returns an object with 'name' and 'desc' properties.
[Excerpted from Visual ARIA ( https://raw.githubusercontent.com/accdc/visual-aria/master/docs/visual-aria/roles.js )
Copyright 2018 Bryan Garaventa (http://whatsock.com/training/matrices/visual-aria.htm)
Part of the ARIA Role Conformance Matrices, distributed under the terms of the Open Source Initiative OSI - MIT License
*/

var calcNames = function(node, fnc, preventSelfCSSRef){
	if (!node || node.nodeType !== 1)
		return;

	var trim = function(str){
		if (typeof str !== 'string')
			return '';

		return str.replace(/^\s+|\s+$/g, '');
	}, walkDOM = function(node, fn, refObj){
		if (!node)
			return;
		fn(node, refObj);

		if (!isException(node, refObj)){
			node = node.firstChild;

			while (node){
				walkDOM(node, fn, refObj);
				node = node.nextSibling;
			}
		}
	}, isException = function(o, refObj){
		if (!refObj || !o || refObj.nodeType !== 1 || o.nodeType !== 1)
			return false;
		var pNode =
						{
						role: refObj.getAttribute('role'),
						name: refObj.nodeName.toLowerCase()
						}, node =
						{
						role: o.getAttribute('role'),
						name: o.nodeName.toLowerCase()
						};

		node.focusable = (o.getAttribute('tabindex') || (node.name == 'a' && o.getAttribute('href'))
			|| ('input,select,button'.indexOf(node.name) !== -1 && o.getAttribute('type') != 'hidden')) ? true : false;

// Always include name from content when the referenced node matches list1, as well as when child nodes match those within list3
		var lst1 =
						{
						roles:
							',link,button,checkbox,option,radio,switch,tab,treeitem,menuitem,menuitemcheckbox,menuitemradio,cell,columnheader,rowheader,tooltip,heading,',
						names: ',a,button,summary,input,h1,h2,h3,h4,h5,h6,menuitem,option,td,th,'
						},

		// Never include name from content when current node matches list2
		lst2 =
						{
						roles:
							',application,alert,log,marquee,status,timer,alertdialog,dialog,banner,complementary,contentinfo,form,main,navigation,region,search,term,definition,article,directory,list,document,feed,figure,group,img,math,note,table,toolbar,menu,menubar,combobox,grid,listbox,radiogroup,textbox,searchbox,spinbutton,scrollbar,slider,tablist,tabpanel,tree,treegrid,separator,rowgroup,row,',
						names:
							',article,aside,body,select,datalist,dd,details,optgroup,dialog,dl,ul,ol,figure,footer,form,header,hr,img,textarea,input,main,math,menu,nav,output,section,table,thead,tbody,tfoot,tr,'
						},

// As an override of list2, conditionally include name from content if current node is focusable, or if the current node matches list3 while the referenced parent node matches list1.
		lst3 =
						{
						roles: ',combobox,term,definition,directory,list,group,note,status,table,rowgroup,row,contentinfo,',
						names: ',dl,ul,ol,dd,details,output,table,thead,tbody,tfoot,tr,'
						};

		// Prevent calculating name from content if the current node matches list2
		if (lst2.roles.indexOf(',' + node.role + ',') >= 0 || (!node.role && lst2.names.indexOf(',' + node.name + ',') >= 0)){

			// Override condition so name from content is sometimes included when the current node matches list3
			if ((lst3.roles.indexOf(',' + node.role + ',') >= 0
				|| (!node.role && lst3.names.indexOf(',' + node.name + ',') >= 0)) &&
			// Then include name from content
			// if the referenced node is the same as the current node and if the current node is focusable,
			((refObj == o && node.focusable) ||
// or if the referenced node is not the same as the current node and if the referencing parent node matches those within list1.
			(refObj != o && (lst1.roles.indexOf(',' + pNode.role + ',') >= 0
				|| (!pNode.role && lst1.names.indexOf(',' + pNode.name + ',') >= 0))))){
				// Override condition detected, so get name from content.
				return false;
			}

			return true;
		}

		return false;
	}, isHidden = function(o, refObj){
		if (o.nodeType !== 1 || o == refObj)
			return false;

		if (o != refObj && ((o.getAttribute && o.getAttribute('aria-hidden') == 'true')
			|| (o.currentStyle && (o.currentStyle['display'] == 'none' || o.currentStyle['visibility'] == 'hidden'))
				|| (document.defaultView && document.defaultView.getComputedStyle && (document.defaultView.getComputedStyle(o,
					'')['display'] == 'none' || document.defaultView.getComputedStyle(o, '')['visibility'] == 'hidden'))
				|| (o.style && (o.style['display'] == 'none' || o.style['visibility'] == 'hidden'))))
			return true;
		return false;
	}, inArray = function(search, stack){
		for (var i = 0; i < stack.length; i++){
			if (stack[i] === search){
				return i;
			}
		}

		return -1;
	}, getCSSText = function(o, refObj){
		if (o.nodeType !== 1 || o == refObj
			|| ' input select textarea img iframe '.indexOf(' ' + o.nodeName.toLowerCase() + ' ') !== -1)
			return false;
		var css =
						{
						before: '',
						after: ''
						};

		if ((document.defaultView && document.defaultView.getComputedStyle
			&& (document.defaultView.getComputedStyle(o, ':before').getPropertyValue('content')
				|| document.defaultView.getComputedStyle(o, ':after').getPropertyValue('content')))){
			css.before = trim(document.defaultView.getComputedStyle(o, ':before').getPropertyValue('content'));
			css.after = trim(document.defaultView.getComputedStyle(o, ':after').getPropertyValue('content'));

			if (css.before == 'none')
				css.before = '';

			if (css.after == 'none')
				css.after = '';
		}
		return css;
	}, hasParentLabel = function(start, targ, noLabel, refObj){
		if (!start || !targ || start == targ)
			return false;

		while (start){
			start = start.parentNode;

			var rP = start.getAttribute ? start.getAttribute('role') : '';
			rP = (rP != 'presentation' && rP != 'none') ? false : true;

			if (!rP && start.getAttribute && ((!noLabel && trim(start.getAttribute('aria-label'))) || isHidden(start, refObj))){
				return true;
			}

			else if (start == targ)
				return false;
		}

		return false;
	};

	if (isHidden(node, document.body) || hasParentLabel(node, document.body, true, document.body))
		return;

	var accName = '', accDesc = '', desc = '', aDescribedby = node.getAttribute('aria-describedby') || '',
		title = node.getAttribute('title') || '', skip = false, rPresentation = node.getAttribute('role');
	rPresentation = (rPresentation != 'presentation' && rPresentation != 'none') ? false : true;

	var walk = function(obj, stop, refObj, isIdRef){
		var nm = '', nds = [], cssOP = {}, idRefNode = null;

		if (inArray(obj, nds) === -1){
			nds.push(obj);

			if (isIdRef || obj == refObj){
				idRefNode = obj;
			}

			// Enabled in Visual ARIA to prevent self referencing by Visual ARIA tooltips
			if (!preventSelfCSSRef)
				cssOP = getCSSText(obj, null);
		}

		walkDOM(obj, function(o, refObj){
			if (skip || !o || (o.nodeType === 1 && isHidden(o, refObj)))
				return;

			var name = '', cssO = {};

			if (inArray(idRefNode && idRefNode == o ? o : o.parentNode, nds) === -1){
				nds.push(idRefNode && idRefNode == o ? o : o.parentNode);
				cssO = getCSSText(idRefNode && idRefNode == o ? o : o.parentNode, refObj);
			}

			if (o.nodeType === 1){
				var aLabelledby = o.getAttribute('aria-labelledby') || '', aLabel = o.getAttribute('aria-label') || '',
					nTitle = o.getAttribute('title') || '', rolePresentation = o.getAttribute('role');
				rolePresentation = (rolePresentation != 'presentation' && rolePresentation != 'none') ? false : true;
			}

			if (o.nodeType === 1
				&& ((!o.firstChild || (o == refObj && (aLabelledby || aLabel))) || (o.firstChild && o != refObj && aLabel))){
				if (!stop && o == refObj && aLabelledby){
					if (!rolePresentation){
						var a = aLabelledby.split(' ');

						for (var i = 0; i < a.length; i++){
							var rO = document.getElementById(a[i]);
							name += ' ' + walk(rO, true, rO, true) + ' ';
						}
					}

					if (trim(name) || rolePresentation)
						skip = true;
				}

				if (!trim(name) && aLabel && !rolePresentation){
					name = ' ' + trim(aLabel) + ' ';

					if (trim(name) && o == refObj)
						skip = true;
				}

				if (!trim(name)
					&& !rolePresentation && ' input select textarea '.indexOf(' ' + o.nodeName.toLowerCase() + ' ') !== -1 && o.id
						&& document.querySelectorAll('label[for="' + o.id + '"]').length){
					var rO = document.querySelectorAll('label[for="' + o.id + '"]')[0];
					name = ' ' + trim(walk(rO, true, rO, true)) + ' ';
				}

				if (!trim(name) && !rolePresentation && (o.nodeName.toLowerCase() == 'img') && (trim(o.getAttribute('alt')))){
					name = ' ' + trim(o.getAttribute('alt')) + ' ';
				}

				if (!trim(name) && !rolePresentation && nTitle){
					name = ' ' + trim(nTitle) + ' ';
				}
			}

			else if (o.nodeType === 3){
				name = o.data;
			}

			if (cssO.before)
				name = cssO.before + ' ' + name;

			if (cssO.after)
				name += ' ' + cssO.after;
			name = ' ' + trim(name) + ' ';

			if (trim(name) && !hasParentLabel(o, refObj, false, refObj)){
				nm += name;
			}
		}, refObj);

		if (cssOP.before)
			nm = cssOP.before + ' ' + nm;

		if (cssOP.after)
			nm += ' ' + cssOP.after;
		nm = trim(nm);

		return nm;
	};

	accName = walk(node, false, node);
	skip = false;

	if (title && !rPresentation){
		if (!trim(accName))
			accName = trim(title);

		else
			desc = trim(title);
	}

	if (aDescribedby && !rPresentation){
		var s = '', d = aDescribedby.split(' ');

		for (var j = 0; j < d.length; j++){
			var rO = document.getElementById(d[j]);
			s += ' ' + walk(rO, true, rO, true) + ' ';
		}

		if (trim(s))
			desc = s;
	}

	if (trim(desc) && !rPresentation)
		accDesc = desc;

	accName = trim(accName.replace(/\s/g, ' ').replace(/\s\s+/g, ' '));
	accDesc = trim(accDesc.replace(/\s/g, ' ').replace(/\s\s+/g, ' '));

	if (accName == accDesc)
		accDesc = '';

	var props =
					{
					name: accName,
					desc: accDesc
					};

	if (fnc && typeof fnc == 'function')
		return fnc.apply(node,
						[
						node,
						props
						]);

	else
		return props;
};

// Customize returned string

var getNames = function(node){
	var props = calcNames(node);
	return 'accName: "' + props.name + '"\n\naccDesc: "' + props.desc + '"';
};