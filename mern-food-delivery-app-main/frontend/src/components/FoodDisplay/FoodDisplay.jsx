import React, { useContext } from 'react'
import { StoreContext } from '../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'
import './FoodDisplay.css'

const FoodDisplay = ({category,search = ""}) => {
  const{food_list}= useContext(StoreContext);
  const filteredFood = food_list.filter((item) => {
  const searchText = search?.toLowerCase() || "";
  const itemName = item.name?.toLowerCase() || "";

  return (
    itemName.includes(searchText) &&
    (category === "All" || category === item.category)
  );
});
  return (
    <div className='food-display' id='food-display'>
       <h3>Top Dishes near you</h3>
       <div className="food-display-list">
  {filteredFood.length === 0 ? (
  <p>No food found 😕</p>
) : (
  filteredFood.map((item, index) => (
    <FoodItem
      key={item._id}
      id={item._id}
      name={item.name}
      description={item.description}
      price={item.price}
      image={item.image}
    />
  ))
)}
</div>
    </div>
  )
}

export default FoodDisplay
