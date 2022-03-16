import hasha from 'hasha';
import { createClient, defineScript } from 'redis';

interface Car {
  id: string,
  userId: string,
  hash: string|null
}

(async () => {
    const client = createClient({
      scripts: {
        getModelByHash: defineScript({
          NUMBER_OF_KEYS: 1,
          SCRIPT:
            `
              -- get the model's hash property by key (carId) and property (hash)
              local modelHash = redis.call('HGET',KEYS[1],ARGV[1]);

              -- check value of hash against passed in hash
              if modelHash == ARGV[2] then
                -- if we found a match for the hash of the object
                return 1;
              elseif modelHash == false then
                -- no matching key
                return 0;
              else
                -- key found but hash mismatched
                return redis.call('HGET',KEYS[1],ARGV[3]);
              end
            `,
          transformArguments(key: string, hashPropertyName: string, hashValue: string, modelPropertyName: string): Array<string> {
            return [key, hashPropertyName, hashValue, modelPropertyName];
          },
          transformReply(model: number|string): string|null {
            if (model == 1)
              return true.toString(); //we found a match against the hash
            else if (model == 0)
              return false.toString(); //we found matching key
            else
              return model.toString(); //we found a matching key but the hash did not match
          }
        })
      }
    });
  
    client.on('error', (err) => console.log('Redis Client Error', err));
    client.on('connect', () => console.log('Redis Client connected'));
  
    await client.connect();

    //create the car object
    const carId = "d80548c0-b22f-469b-a763-bd3fe7e1a594";
    const userId = "d16e444c-d428-4a28-a0b3-778f31513a24";

    const car: Car = {
      id: carId,
      userId: userId,
      hash: null
    };

    let {hash, ...carWithoutHashProperty} = car;
    car.hash = await hasha.async(JSON.stringify(carWithoutHashProperty));

    const stringifiedCar = JSON.stringify(car);

    //create the redis hashmap
    await client.hSet(carId, 'model', stringifiedCar);
    await client.hSet(carId, 'hash', car.hash);
  
    //get the values of the hashmap by carId
    const passedInHashMatchesStoredCar = await client.getModelByHash(
      carId, 
      'hash', 
      '5fad62a7a45fd1414fcd7553bef484585b555b0ff7251b519b9ae5a191c64637a820a85c33bb69488accdfd221d933ab8cf825774c2e0bd561420539527ab131',
      'model'
    );  //true

    console.log(passedInHashMatchesStoredCar);

    const keyDoesntExist = await client.getModelByHash(
      "fdfdfd", 
      'hash', 
      '5fad62a7a45fd1414fcd7553bef484585b555b0ff7251b519b9ae5a191c64637a820a85c33bb69488accdfd221d933ab8cf825774c2e0bd561420539527ab131',
      'model'
    );  //false

    console.log(keyDoesntExist);

    const hashDidNotMatch = await client.getModelByHash(
      carId, 
      'hash', 
      '5ssdsd',
      'model'
    );  //car object

    console.log(hashDidNotMatch);
  })();