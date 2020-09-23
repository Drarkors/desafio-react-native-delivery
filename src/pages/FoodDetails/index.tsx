import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Alert, Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {
  NavigationHelpersContext,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      try {
        const fav = await api.get(`favorites/${routeParams.id}`);

        fav.data ? setIsFavorite(true) : setIsFavorite(false);
      } catch (err) {
        setIsFavorite(false);
      }

      const { data } = await api.get(`foods/${routeParams.id}`);

      const formattedFood = {
        ...data,
        formattedPrice: formatValue(data.price),
      };

      const formattedExtras = formattedFood.extras.map((item: Extra) => {
        return { ...item, quantity: 0 };
      });

      setFood(formattedFood);
      setExtras(formattedExtras);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    setExtras(items => {
      return items.map(extra => {
        return {
          ...extra,
          quantity: extra.id === id ? extra.quantity + 1 : extra.quantity,
        };
      });
    });
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    setExtras(items => {
      return items.map((extra: Extra) => {
        return {
          ...extra,
          quantity:
            extra.id === id && extra.quantity > 0
              ? extra.quantity - 1
              : extra.quantity,
        };
      });
    });
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(quantity => {
      return quantity + 1;
    });
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    setFoodQuantity(quantity => {
      return quantity > 1 ? quantity - 1 : 1;
    });
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not
    if (!isFavorite) {
      api.post('favorites', { ...food });
    } else {
      api.delete(`favorites/${food.id}`);
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const extraTotal = extras.reduce((accumulator, extra) => {
      return accumulator + extra.quantity * extra.quantity;
    }, 0);

    return formatValue((food.price + extraTotal) * foodQuantity);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    try {
      const { data } = await api.post('orders', { ...food, extras });

      Alert.alert('Sucesso!', 'O seu pedido foi feito com sucesso.', [
        { text: 'Ok' },
      ]);

      navigation.reset({
        routes: [
          {
            name: 'Dashboard',
          },
        ],
        index: 0,
      });
    } catch (err) {
      Alert.alert(
        'Erro!',
        'Houve algum erro no envio do pedido, tente novamente.',
        [{ text: 'Ok' }],
      );
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
