// Food image map - maps menu item names to their images
import cheeseburger from "@/assets/food/cheeseburger.jpg";
import bbqBaconBurger from "@/assets/food/bbq-bacon-burger.jpg";
import loadedFries from "@/assets/food/loaded-fries.jpg";
import milkshake from "@/assets/food/milkshake.jpg";
import jollofRice from "@/assets/food/jollof-rice.jpg";
import suyaSkewers from "@/assets/food/suya-skewers.jpg";
import egusiSoup from "@/assets/food/egusi-soup.jpg";
import puffPuff from "@/assets/food/puff-puff.jpg";
import generalTsos from "@/assets/food/general-tsos.jpg";
import beefLoMein from "@/assets/food/beef-lo-mein.jpg";
import porkFriedRice from "@/assets/food/pork-fried-rice.jpg";
import springRolls from "@/assets/food/spring-rolls.jpg";
import carneAsadaTacos from "@/assets/food/carne-asada-tacos.jpg";
import chickenBurrito from "@/assets/food/chicken-burrito.jpg";
import chipsGuacamole from "@/assets/food/chips-guacamole.jpg";
import horchata from "@/assets/food/horchata.jpg";
import margheritaPizza from "@/assets/food/margherita-pizza.jpg";
import fettuccineAlfredo from "@/assets/food/fettuccine-alfredo.jpg";
import bruschetta from "@/assets/food/bruschetta.jpg";
import tiramisu from "@/assets/food/tiramisu.jpg";
import salmonSashimi from "@/assets/food/salmon-sashimi.jpg";
import dragonRoll from "@/assets/food/dragon-roll.jpg";
import chickenTeriyaki from "@/assets/food/chicken-teriyaki.jpg";
import misoSoup from "@/assets/food/miso-soup.jpg";
import butterChicken from "@/assets/food/butter-chicken.jpg";
import lambBiryani from "@/assets/food/lamb-biryani.jpg";
import garlicNaan from "@/assets/food/garlic-naan.jpg";
import mangoLassi from "@/assets/food/mango-lassi.jpg";
import padThai from "@/assets/food/pad-thai.jpg";
import greenCurry from "@/assets/food/green-curry.jpg";
import thaiIcedTea from "@/assets/food/thai-iced-tea.jpg";
import mangoStickyRice from "@/assets/food/mango-sticky-rice.jpg";
import jerkChicken from "@/assets/food/jerk-chicken.jpg";
import oxtailStew from "@/assets/food/oxtail-stew.jpg";
import beefPatty from "@/assets/food/beef-patty.jpg";
import sorrelDrink from "@/assets/food/sorrel-drink.jpg";
import bulgogiBowl from "@/assets/food/bulgogi-bowl.jpg";
import koreanFriedChicken from "@/assets/food/korean-fried-chicken.jpg";
import japchae from "@/assets/food/japchae.jpg";
import kimchiJjigae from "@/assets/food/kimchi-jjigae.jpg";

const foodImages: Record<string, string> = {
  "Classic Cheeseburger": cheeseburger,
  "BBQ Bacon Burger": bbqBaconBurger,
  "Loaded Fries": loadedFries,
  "Milkshake": milkshake,
  "Jollof Rice & Chicken": jollofRice,
  "Suya Skewers": suyaSkewers,
  "Egusi Soup & Pounded Yam": egusiSoup,
  "Puff Puff": puffPuff,
  "General Tso's Chicken": generalTsos,
  "Beef Lo Mein": beefLoMein,
  "Pork Fried Rice": porkFriedRice,
  "Spring Rolls (4pc)": springRolls,
  "Carne Asada Tacos (3)": carneAsadaTacos,
  "Chicken Burrito": chickenBurrito,
  "Chips & Guacamole": chipsGuacamole,
  "Horchata": horchata,
  "Margherita Pizza": margheritaPizza,
  "Fettuccine Alfredo": fettuccineAlfredo,
  "Bruschetta": bruschetta,
  "Tiramisu": tiramisu,
  "Salmon Sashimi (8pc)": salmonSashimi,
  "Dragon Roll": dragonRoll,
  "Chicken Teriyaki Bowl": chickenTeriyaki,
  "Miso Soup": misoSoup,
  "Butter Chicken": butterChicken,
  "Lamb Biryani": lambBiryani,
  "Garlic Naan (2pc)": garlicNaan,
  "Mango Lassi": mangoLassi,
  "Pad Thai": padThai,
  "Green Curry": greenCurry,
  "Thai Iced Tea": thaiIcedTea,
  "Mango Sticky Rice": mangoStickyRice,
  "Jerk Chicken Plate": jerkChicken,
  "Oxtail Stew": oxtailStew,
  "Beef Patty": beefPatty,
  "Sorrel Drink": sorrelDrink,
  "Bulgogi Bowl": bulgogiBowl,
  "Korean Fried Chicken": koreanFriedChicken,
  "Japchae": japchae,
  "Kimchi Jjigae": kimchiJjigae,
};

export function getFoodImage(name: string): string | undefined {
  return foodImages[name];
}

export default foodImages;
