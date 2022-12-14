module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;

    this.add = function(item, id, quantity, variation){
        var storedItem = this.items[id];
        // console.log('selected variation: ', variation);

        if (!storedItem) {
            storedItem = this.items[id] = {item: item, variation: variation, qty: 0, price: 0};
        }

        storedItem.variation = variation;
        // console.log('storedQuantity before adding new quantity: ', storedItem.qty);
        // console.log('quantity input in view-cart page: ', quantity);
        storedItem.qty = parseInt(storedItem.qty) + parseInt(quantity);
        storedItem.price = storedItem.item.price * parseInt(storedItem.qty);
        this.totalQty += parseInt(quantity);

        let prices = [];
        Object.values(this.items).forEach(val => {
            prices.push(val.price);
        });
        
        this.totalPrice = 0;
        for (const value of prices) {
            this.totalPrice += value;
        }; 
    };

    this.reduceByOne = function(id) {
        this.items[id].qty--;
        this.items[id].price -= this.items[id].item.price;
        this.totalQty--;
        this.totalPrice -= this.items[id].item.price;

        if(this.items[id].qty <= 0){
            delete this.items[id];
        }
    };

    this.addByOne = function(id) {
        this.items[id].qty++;
        this.items[id].price += this.items[id].item.price;
        this.totalQty++;
        this.totalPrice += this.items[id].item.price;
    };

    this.removeItem = function(id){
        this.totalQty -= this.items[id].qty;
        this.totalPrice -= this.items[id].price;
        delete this.items[id];
    }

    this.generateArray = function(){
        var arr = [];
        for (var id in this.items){
            arr.push(this.items[id]);
        }
        return arr;
    };
};