/******************************************************* 
BUDGET CONTROLLER
*******************************************************/
var budgetController = (function() {
    // Function constructor (var uses capital letter at the beginning) to create multiple expense objects 
    var Expense = function(id, description, value){
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };
    
    Expense.prototype.calcPercentage = function(totalIncome){
        if(totalIncome > 0)
            {
                this.percentage = Math.round((this.value / totalIncome) * 100);
            }
        else
            {
                this.percentage = -1;
            }
    };
    
    Expense.prototype.getPercentage = function(){
        return this.percentage;  
    };
    
    // Function constructor (var uses capital letter at the beginning) to create multiple income objects
    var Income = function(id, description, value){
        this.id = id;
        this.description = description;
        this.value = value;
    };
    
    var calculateTotal = function(type){
        // Get values from either exp or inc array and loop over them to add them together
        var sum = 0;
        
        // Current will refer to either the expense or income object that is stored in the current element of the array
        data.allItems[type].forEach(function(curr){
            sum += curr.value;
        });
        
        // Store sum in totals object
        data.totals[type] = sum;
    };
    
    // Object to store data
    var data = {
        // Expense and Income objects are stored in corresponding arrays
        allItems: {
            exp: [],
            inc: []
        },
        // Object to store total expense and income
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        // -1 is often a value that is set to show something doesn't exist yet
        percentage: -1
    }
    
    // Public method to allow other modules to add data into the data structure
    // Know from getInput method that type will be inc or exp
    return{
        addItem: function(type, desc, val){
            var newItem, ID;
            // Create new ID
            // Each ID should be unique
            // ID should equal last ID (length of array - 1) + 1
            if(data.allItems[type].length > 0)
                {
                    ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
                }
            else
                {
                    ID = 0;
                }
            
            
            // Create new item based on exp or inc type
            if(type === 'exp')
                {
                    newItem = new Expense(ID, desc, val);
                }
            else if(type === 'inc')
                {
                    newItem = new Income(ID, desc, val);
                }
            
            // Push into data structure
            
            // Will push to appropriate array because type is exp or inc which is the name of the arrays
            data.allItems[type].push(newItem);
            
            // Return new element
            // Other modules will have access to the new item
            return newItem;
        },
        
        deleteItem: function(type, id) {
            var ids, index;
            // Cannot just delete arrayElement[id] because if other elements have been deleted, this would result in the wrong one being deleted
            // Instead can find at what index our id is located
            
            // Difference between map and forEach is that map returns a brand new array
            ids = data.allItems[type].map(function(current) {
                return current.id;
            });
            
            // indexOf method returns the element of the array that we pass in (id)
            index = ids.indexOf(id);
            
            // Delete item from array
            if(index !== -1)
                {
                    // First argument of splice method is location at which to start deleting
                    // Second argument is how many elements to delete
                    data.allItems[type].splice(index, 1);
                }
        },
        
        calculateBudget: function() {
            // Calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');
            
            // Calculate the budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;
            
            // Calculate the percentage of income that has been spent (only if there is some income to divide by)
            if (data.totals.inc > 0)
                {
                    data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
                }
            else
                {
                    data.percentage = -1;
                }
            
        },
        
        calculatePercentages: function(){
            data.allItems.exp.forEach(function(curr) {
                curr.calcPercentage(data.totals.inc);
            });
        },
        
        getBudget: function() {
            return{
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },
        
        getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(curr){
                return curr.getPercentage();
            });
            return allPerc;
        }
    }
})();

/******************************************************* 
UI CONTROLLER
*******************************************************/
// This variable is an IIFE that returns an object with the functions that we want to be public
var UIController = (function(){
    
    // Avoids having all the query selector strings. If any class names are changed they can easily be updated here
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputButton: '.add__btn',
        incomeContainer: '.income__list',
        expenseContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };
    
    var formatNumber = function(num, type) {
            /*
            + or - before number
            Exactly 2 decimal points
            Comma separating the thousands
            */
            
            var numSplit, int, dec, type;
            // Removes any sign associated with the number
            num = Math.abs(num);
            
            // A method of the number prototype (JavaScript will automatically convert the primitive type to an object to be able to use these methods), to set the number to 2 decimal places
            num = num.toFixed(2);
            
            // Splits the number surrounding the decimal point and stores it in an array
            numSplit = num.split('.');
            
            int = numSplit[0];
            if(int.length > 3)
                {
                    // Substring method allows us to take part of a string - two arguments - where we want to start and how many characters we want
                    int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, int.length);
                }
            
            dec = numSplit[1];
            
            // Ternary operator
            return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
        };
    
    // This function loops over the list and performs the callback function on each element with the parameters specified below (current and index)
    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++)
            {
                callback(list[i], i);
            }
    };
    
    // Public objects
    return{
        getInput: function(){
            return{
                // Best way to return multiple variables - as properties of an object
                type: document.querySelector(DOMstrings.inputType).value, // Will be either inc or exp as it is a 'select' element
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            }; 
        },
        
        // newItem variable now stores an object which will be passed to the addListItem method
        addListItem: function(obj, type){
            var html, newHtml, element;
            // Create HTML string with placeholder text
            
            if(type === 'inc')
                {
                    element = DOMstrings.incomeContainer;
                    html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
                }
            else if(type === 'exp')
                {
                    element = DOMstrings.expenseContainer;
                    html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
                }
            
            // Replace the placeholder text with some actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            // Instead of passing the object's value, pass the result of formatting the number
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));
            
            // Insert the HTML into the DOM
            // Insert adjacent html method accepts position then text
            // Four position we can insert html - before or after parent beforebegin, afterend, or as a child of the parent afterbegin, beforeend
            // We are inserting into expenses or income list div - so we need beforeend (each new child added to the end) - we are creating lots of children of the expenses or income list item
            
            //element will be income__list if it is an income and vice versa
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },
        
        deleteListItem: function(selectorID) {
            // Can't delete an element in HTML, can only delete a child
            
            // Select element we want to delete by its ID (passed into this method)
            
            // Then move to the parent element using parentNode
            
            // Then specify which element to delete by stating element by ID again
            
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);  
        }, 
        
        clearFields: function() {
           var fields, fieldsArr; 
            
            // querySelectorAll returns a list
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            
            // Convert list to an array
            // Slice method normally makes a copy of an array but can 'trick' it by passing in a list and turning it into an array
            // Calling fields.slice will not work because fields is not an array
            // Use the call method and pass fields into it so it becomes the this variable
            // Slice method is in the arrays prototype properties
            // Because slice is a method - call will work
            fieldsArr = Array.prototype.slice.call(fields);
            
            // Can now loop over the array to clear fields
            // Pass a callback function into the forEach method and then this function is applied to each element of the array
            // current = current element in the array being looped over
            // index = 0 indexed number of element being processed
            // array = entire array
            fieldsArr.forEach(function(current, index, array) {
                current.value = "";
            });
            
            // Sets focus back to description text box after clearing fields
            fieldsArr[0].focus();
        },
        
        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
            
            
            // Don't want percentage to show -1, so handling case where percentage is below zero
            if(obj.percentage > 0)
                {
                   document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%'; 
                }
            else
                {
                    document.querySelector(DOMstrings.percentageLabel).textContent = '---';
                }
        },
        
        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel); // Returns a nodeLIST
            // In the DOM tree where each HTML element is stored, each element is called a node
            
            // node LIST does not have for each method
            // Rather than using slice method (tricking compiler to turn into an array), can make our own forEach method for lists
            
            // When we call the nodeList function we pass a callback function into it which is assigned to the callback parameter above
            nodeListForEach(fields, function(current, index) {
                if(percentages[index] > 0)
                    {
                        current.textContent = percentages[index] + '%';
                    }
                else
                    {
                        current.textContent = '---';
                    }
            });
        },
        
        displayMonth: function() {
            var now, year, months, month;
            // If we don't pass anything into the data constructor it will be the date of today
            
            now = new Date();
            
            year = now.getFullYear();
            
            // Month returns a zero based number, so can create an array to store months to display text version
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth();
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
        },
        
        changedType: function() {
            // A string of all the fields we want to change when income or expense symbol is changed
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue);
            // querySelectorAll returns a Node List
            nodeListForEach(fields, function(curr) {
                curr.classList.toggle('red-focus');
            });
            
            document.querySelector(DOMstrings.inputButton).classList.toggle('red');
        },
        
        getDOMstrings: function() {
            // Exposing the DOMstrings into the public
            return DOMstrings;
        }
    };
})();

/******************************************************* 
GLOBAL CONTROLLER
*******************************************************/

// We can pass arguments into modules as they are functions
// Pass other two modules into the controller module
// In the parentheses that call this IIFE, pass 

/* Could have used the other modules just inside this module without passing them in, but then if the module name ever changed would have to change it everywhere. Currently only need to change it at the bottom.*/
var controller = (function(budgetCtrl, UICtrl){
    
    // Organises code so all event listeners are in one function
    var setupEventListeners = function(){
        // Ensures access to the add__btn string
        var DOM = UICtrl.getDOMstrings();
        
        // Event listener for button press
        document.querySelector(DOM.inputButton).addEventListener('click', ctrlAddItem);
        // Event listener for enter key (key 13)
        // Some older browsers use the which property instead of keyCode property
        document.addEventListener('keypress', function(event) {
            if(event.keyCode === 13 || event.which === 13)
                {
                    ctrlAddItem();
                }
        });
        
        // Event listener for deleting a budget item
        // Want to use event delegation because there could be many 'i' elements in the html file once many budget items are added, 
        // plus there are no i elements when the page loads
        // Delegate the event to the parent element 'container' because it holds both income and expense containers
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
        
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    };
    
    var updateBudget = function(){
        // Calculate the budget
        budgetCtrl.calculateBudget();
        
        // Return the budget
        var budget = budgetCtrl.getBudget();

        // Display the budget on the UI 
        // budget is the object that is returned from the getBudget method in the budget controller
        UICtrl.displayBudget(budget);
    };
    
    var updatePercentages = function(){
        // Calculate the percentages
        budgetCtrl.calculatePercentages();
        
        // Read percentages from the budget controller
        var percentages = budgetCtrl.getPercentages();
        
        // Update the UI
        UICtrl.displayPercentages(percentages);
    };
    
    var ctrlAddItem = function(){
        var input, newItem;
        
        // Get the field input data
        input = UICtrl.getInput(); // The public method from UI module that we can access
        console.log(input);
        
        // Only want item added if fields are validated
        if(input.description !== "" && !isNaN(input.value) && input.value > 0)
            {
                // Add the item to the budget controller
                newItem = budgetCtrl.addItem(input.type, input.description, input.value);

                // Add the item to the UI
                UICtrl.addListItem(newItem, input.type);

                // Clear the fields
                UICtrl.clearFields();

                // Calculate and update budget
                updateBudget();
                
                // Calculate and update percentages
                updatePercentages();
            }
    };
    
    // When hitting the i element (x button), parentNode changes the target to the parent element which is button
    // We actually want to move up four elements to get to the div element income or expense-[n]
    // There are no ids in the rest of the HTML document
    var ctrlDeleteItem = function(event){
      var itemID, splitID, type, ID;
        
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;  
        
        // Will be coerced to true if an ID exists
        if(itemID)
            {
                // Split string e.g. inc-1 into type and id by splitting it around the dash key
                splitID = itemID.split('-');
                // Type will now be the first element of the array
                type = splitID[0];
                // ID will now be the second element of the array - however it is a string, and when passed into the deleteItem method - will not work
                ID = parseInt(splitID[1]);
                
                // Delete the item from the data structure
                budgetCtrl.deleteItem(type, ID);
                
                // Delete the item from the UI
                UICtrl.deleteListItem(itemID);
                
                // Re calculate budget and UI
                updateBudget();
                
                // Calculate and update percentages
                updatePercentages();
            }
    };
    
    // Ensures the event listener function gets called - through a public init function
    return {
        init: function(){
            // Sets everything in budget object to 0 on initialisation
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
            UICtrl.displayMonth();
        }
    }
})(budgetController, UIController);


// Only line of code placed on the outside. Calls init function. Without this line of code, nothing will happen. 
// Without this line of code there would be no event listeners.
controller.init();
