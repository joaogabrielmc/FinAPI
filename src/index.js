const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
const customers = [];
app.use(express.json());

/**
 * cpf - string
 * name - string
 * id - uuid {é um identificador unico universal, gera um numero}
 * statement - []
 */

//Midleware API
function verifyIfExistAccount(request, response, next) {
	const { cpf } = request.headers;

	const customer = customers.find((customer) => customer.cpf === cpf);

	if (!customer) {
		return response.status(400).json({ error: "Customer not found" });
	}

	request.customer = customer;

	return next();
}

function getBalance(statement) {
	const balance = statement.reduce((acc, operation) => {
		if (operation.type === "credit") {
			return acc + operation.amount;
		} else {
			return acc - operation.amount;
		}
	}, 0);
	return balance;
}

app.post("/account", (request, response) => {
	const { cpf, name } = request.body;

	const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

	if (customerAlreadyExists) {
		return response.status(400).json({ error: "Customer already exists" });
	}

	customers.push({
		cpf,
		name,
		id: uuidv4(),
		statement: [],
	});
	console.log(customers);
	return response.status(201).send();
});

/*Caso eu queira que tudo a seguir tenha o midleware */
// app.use(verifyIfExistAccount);

app.get("/statement", verifyIfExistAccount, (request, response) => {
	const { customer } = request;
	return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistAccount, (request, response) => {
	const { description, amount } = request.body;

	const { customer } = request;

	customer.statement.push({
		description,
		amount,
		created_at: new Date(),
		type: "credit",
	});

	console.log(customer);
	return response.status(201).send();
});

app.post("/withdraw", verifyIfExistAccount, (request, response) => {
	const { amount } = request.body;
	const { customer } = request;

	const balance = getBalance(customer.statement);

	if (balance < amount) {
		return response.status(400).json({ error: "Insufficient funds" });
	}

	customer.statement.push({
		amount,
		created_at: new Date(),
		type: "debit",
	});
	return response.status(201).send();
});

app.get("/statement/date", verifyIfExistAccount, (request, response) => {
	const { customer } = request;
	const { date } = request.query;

	const dateFormat = new Date(date + " 00:00");

	const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat)).toDateString;
	console.log(dateFormat);
	return response.json(statement);
});

app.put("/account", verifyIfExistAccount, (request, response) => {
	const { name } = request.body;
	const { customer } = request;

	customer.name = name;

	return response.status(201).send();
});

app.get("/account", verifyIfExistAccount, (request, response) => {
	const { customer } = request;

	return response.json(customer);
});

app.delete("/account", verifyIfExistAccount, (request, response) => {
	const { customer } = request;

	//splice
	customers.splice(customer, 1);

	return response.status(200).json(customer);
});

app.get("/balance", verifyIfExistAccount, (request, response) => {
	const { customer } = request;

	const balance = getBalance(customer.statement);
	console.log(balance);
	return response.json(balance);
});

app.listen(3333);
