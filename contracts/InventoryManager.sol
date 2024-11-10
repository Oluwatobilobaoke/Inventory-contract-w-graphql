// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract InventoryManager {
    struct Product {
        uint256 id;
        string name;
        uint256 price;
        uint256 quantity;
        bool exists;
    }
    
    mapping(uint256 => Product) private products;
    uint256 private productCount;
    bool private locked;
    
    // Ownable implementation
    address private _owner;
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ProductUpdated(uint256 indexed id, string name, uint256 price, uint256 quantity);
    event ProductAdded(uint256 indexed id, string name, uint256 price, uint256 quantity);

    constructor() {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "Caller is not the owner");
        _;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    // Reentrancy protection
    modifier noReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    // Rest of the contract remains the same
    function addProduct(string memory _name, uint256 _price, uint256 _quantity) 
        external 
        onlyOwner 
        noReentrant
        returns (uint256)
    {
        productCount++;
        products[productCount] = Product(
            productCount,
            _name,
            _price,
            _quantity,
            true
        );
        
        emit ProductAdded(productCount, _name, _price, _quantity);
        return productCount;
    }
    
    function updateProduct(uint256 _id, uint256 _price, uint256 _quantity) 
        external 
        onlyOwner 
        noReentrant 
    {
        require(products[_id].exists, "Product does not exist");
        
        products[_id].price = _price;
        products[_id].quantity = _quantity;
        
        emit ProductUpdated(_id, products[_id].name, _price, _quantity);
    }
    
    function getProduct(uint256 _id) 
        external 
        view 
        returns (string memory name, uint256 price, uint256 quantity) 
    {
        require(products[_id].exists, "Product does not exist");
        Product memory product = products[_id];
        return (product.name, product.price, product.quantity);
    }
    
    function getProductCount() external view returns (uint256) {
        return productCount;
    }
}