import React, { useContext } from 'react'
import { StoreContext } from '../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'
import { SearchX } from 'lucide-react'
import './FoodDisplay.css'

const FoodDisplay = ({ category, search = "" }) => {
  const { food_list } = useContext(StoreContext);
  const trimmedSearch = search?.trim() || "";
  const searchText = trimmedSearch.toLowerCase();

  const filteredFood = food_list.filter((item) => {
    const itemName = item.name?.toLowerCase() || "";
    const itemCat = item.category?.toLowerCase() || "";
    const itemDesc = item.description?.toLowerCase() || "";

    const matchesSearch = !searchText || 
      itemName.includes(searchText) || 
      itemCat.includes(searchText) || 
      itemDesc.includes(searchText);

    const matchesCategory = category === "All" || category === item.category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className='food-display' id='food-display'>
      <div className="food-display-header">
        {trimmedSearch ? (
          <h2>
            Search Results for <span className="search-query-highlight">"{trimmedSearch}"</span>
          </h2>
        ) : (
          <h2>Top Dishes near you</h2>
        )}
      </div>

      {filteredFood.length === 0 ? (
        <div className="no-food-found">
          <div className="no-food-icon-wrap">
            <SearchX size={38} />
          </div>
          <h3>No food items found for "{trimmedSearch}"</h3>
          <p>Try searching for popular dishes like <span>Pizza</span>, <span>Burger</span>, <span>Cake</span>, <span>Salad</span>, or <span>Pasta</span>.</p>
        </div>
      ) : (
        <div className="food-display-list">
          {filteredFood.map((item) => (
            <FoodItem
              key={item._id}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodDisplay;
