import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid';

const prismaClient = new PrismaClient()

async function main() {

  const schoolId = uuidv4();

  const school = await prismaClient.school.create({
    data: {
      id: schoolId,
      name: "EduEdu Escola",
      created_at: new Date()
    }
  });

  // TODO: Criar usuários apenas em Dev
  const users = await prismaClient.user.createMany({
    data: [
      {"id":uuidv4(),"name":"Andria Bluschke","document":"8917404804","email":"abluschke0@hc360.com","profile":"Director", "schoolId": schoolId},
      {"id":uuidv4(),"name":"Stormie Munson","document":"2220389421","email":"smunson1@blinklist.com","profile":"Teacher", "schoolId": schoolId},
      {"id":uuidv4(),"name":"Ford Leavry","document":"7843663711","email":"fleavry2@ameblo.jp","profile":"Teacher", "schoolId": schoolId},
      {"id":uuidv4(),"name":"Roseline Cornish","document":"7449994739","email":"rcornish3@telegraph.co.uk","profile":"Teacher", "schoolId": schoolId},
      {"id":uuidv4(),"name":"Hamel Horder","document":"3140339690","email":"hhorder4@discuz.net","profile":"Teacher", "schoolId": schoolId},
      {"id":uuidv4(),"name":"Jonah Vice","document":"9424612346","email":"jvice5@wufoo.com","profile":"Teacher", "schoolId": schoolId},
      {"id":uuidv4(),"name":"Normy Benn","document":"1199955876","email":"nbenn6@squarespace.com","profile":"Teacher", "schoolId": schoolId},
      {"id":uuidv4(),"name":"Laney Calcraft","document":"6637235598","email":"lcalcraft7@theatlantic.com","profile":"Teacher", "schoolId": schoolId},
      {"id":uuidv4(),"name":"Cobbie Yuryichev","document":"7581428397","email":"cyuryichev8@nationalgeographic.com","profile":"Teacher", "schoolId": schoolId},
      {"id":uuidv4(),"name":"Miof mela Armfirld","document":"2259795951","email":"mmela9@ustream.tv","profile":"Teacher", "schoolId": schoolId},
      {"id":uuidv4(),"name":"Griswold Dencs","document":"6958859316","email":"gdencs0@uol.com.br","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Christabella Hammond","document":"8340577719","email":"chammond1@photobucket.com","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Carina Larvor","document":"9717350140","email":"clarvor2@icio.us","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Gayler Mallall","document":"9540670519","email":"gmallall3@dot.gov","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Northrup Manueau","document":"1880980703","email":"nmanueau4@prweb.com","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Guglielmo Birkby","document":"3183903792","email":"gbirkby5@usa.gov","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Mallory Andri","document":"9167455743","email":"mandri6@bloglovin.com","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Georgia Freke","document":"5918706615","email":"gfreke7@un.org","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Corette Aneley","document":"1800836104","email":"caneley8@accuweather.com","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Petrina Martineau","document":"4516996006","email":"pmartineau9@mapquest.com","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Chancey Matei","document":"2460000731","email":"cmateia@bing.com","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Yasmin Panton","document":"7611027735","email":"ypantonb@hud.gov","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Kirbie Stockley","document":"1470800969","email":"kstockleyc@forbes.com","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Elinor Cud","document":"1699452660","email":"ecudd@arizona.edu","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Keene Alan","document":"0043684165","email":"kalane@cdbaby.com","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Jaynell Dunniom","document":"6905764779","email":"jdunniomf@dedecms.com","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Nataniel Teasdale-Markie","document":"4771982325","email":"nteasdalemarkieg@jugem.jp","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Kasey Blackaller","document":"2675748382","email":"kblackallerh@mashable.com","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Randal Walne","document":"1907519696","email":"rwalnei@virginia.edu","profile":"Teacher","schoolId": schoolId},
      {"id":uuidv4(),"name":"Ossie O'Brien","document":"9214318255","email":"oobrienj@lycos.com","profile":"Teacher","schoolId": schoolId},
    ]
  });

  console.log(school);
}

main().then(async () => {
  await prismaClient.$disconnect()
}).catch(async (e) => {
  console.error(e)
  await prismaClient.$disconnect()
  process.exit(1)
})
