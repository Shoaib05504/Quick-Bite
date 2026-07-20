import React, { useState, useEffect } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'
import MoodBite from '../../components/MoodBite/MoodBite'

const Home = ({search,setSearch}) => {

  const [category, setCategory] = useState('All')

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const targetId = hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, []);
 
  return (
    <div>
      <Header/>
      <MoodBite />
      <ExploreMenu category={category} setCategory={setCategory}/>
      <FoodDisplay category={category}
      search={search}/>
      <AppDownload/>
    </div>
  )
}

export default Home