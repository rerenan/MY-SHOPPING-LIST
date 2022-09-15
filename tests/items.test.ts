import { prisma } from './../src/database';
import dotenv from "dotenv";
import supertest from "supertest";
import app from "../src/app";
import itemFactory from "./factories/itemFactory";
import { array } from 'joi';
import { portalSuspended } from 'pg-protocol/dist/messages';

dotenv.config();

console.log(`Minha aplicação está usando o db:${process.env.DATABASE_URL}`)

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "items"`;
});

describe('Testa POST /items ', () => {
  it('Deve retornar 201, se cadastrado um item no formato correto', async ()=>{
    const item = await itemFactory();

    const result = await supertest(app).post("/items").send(item);

    const createdItem = await prisma.items.findUnique({
      where:{
        title: item.title
      }
    })

    
    expect(createdItem).not.toBeNull();
  });

  it('Deve retornar 409, ao tentar cadastrar um item que exista', async () =>{
    const item = await itemFactory();

    await supertest(app).post("/items").send(item);

    const result = await supertest(app).post("/items").send(item);

    expect(result.status).toEqual(409);
  })
});

describe('Testa GET /items ', () => {
  it('Deve retornar status 200 e o body no formato de Array', async () => {
    const result = await supertest(app).get("/items");
    expect(result.status).toEqual(200);
    expect(result.body).toBeInstanceOf(Array);
  });
});

describe('Testa GET /items/:id ', () => {
  it('Deve retornar status 200 e um objeto igual a o item cadastrado',async () => {

    const item = await itemFactory();

    await supertest(app).post("/items").send(item);

    const createdItem = await prisma.items.findUnique({
      where:{
        title: item.title
      }
    })
    const result = await supertest(app).get(`/items/${createdItem.id}`);
    
    expect(result.status).toEqual(200);
    expect(result.body).toEqual(createdItem)
  });
  it('Deve retornar status 404 caso não exista um item com esse id',async () => {
    
    const item = await itemFactory();

    await supertest(app).post("/items").send(item);

    const createdItem = await prisma.items.findUnique({
      where:{
        title: item.title
      }
    })

    const result = await supertest(app).get(`/items/${createdItem.id+100}`);

    expect(result.status).toEqual(404);
  });
});

afterAll(async ()=>{
  await prisma.$disconnect();
});