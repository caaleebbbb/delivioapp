import libertyBurger from "@/assets/logos/liberty-burger-co.png";
import mamaNkechi from "@/assets/logos/mama-nkechis-kitchen.png";
import goldenDragon from "@/assets/logos/golden-dragon-palace.png";
import casaDeSabor from "@/assets/logos/casa-de-sabor.png";
import napolisTrattoria from "@/assets/logos/napolis-trattoria.png";
import sakuraSushi from "@/assets/logos/sakura-sushi-bar.png";
import tajSpice from "@/assets/logos/taj-spice-house.png";
import bangkokStreet from "@/assets/logos/bangkok-street-eats.png";
import islandVibes from "@/assets/logos/island-vibes-grill.png";
import seoulKitchen from "@/assets/logos/seoul-kitchen-bbq.png";

const restaurantLogos: Record<string, string> = {
  "Liberty Burger Co.": libertyBurger,
  "Mama Nkechi's Kitchen": mamaNkechi,
  "Golden Dragon Palace": goldenDragon,
  "Casa de Sabor": casaDeSabor,
  "Napoli's Trattoria": napolisTrattoria,
  "Sakura Sushi Bar": sakuraSushi,
  "Taj Spice House": tajSpice,
  "Bangkok Street Eats": bangkokStreet,
  "Island Vibes Grill": islandVibes,
  "Seoul Kitchen BBQ": seoulKitchen,
};

export function getRestaurantLogo(name: string): string | undefined {
  return restaurantLogos[name];
}

export default restaurantLogos;
