const { expect } = require("chai");
const { ethers } = require("hardhat");
const { v4: uuidv4 } = require("uuid");

describe("TodoWeb3", () => {
  let todoWeb3;
  let deployer;
  let uuid1, uuid2;
  const CONTENT1 = "Task 1";
  const CONTENT2 = "Task 2";
  beforeEach(async () => {
    [deployer] = await ethers.getSigners();
    const TodoWeb3 = await ethers.getContractFactory("TodoWeb3");
    todoWeb3 = await TodoWeb3.deploy();
    uuid1 = uuidv4();
    uuid2 = uuidv4();
    // Create two tasks
    let tx1 = await todoWeb3.connect(deployer).createTask(uuid1, CONTENT1, false);
    await tx1.wait();
    let tx2 = await todoWeb3.connect(deployer).createTask(uuid2, CONTENT2, false);
    await tx2.wait();
  });

  describe("Create Task", () => {
    it("creates the task", async () => {
      const result = await todoWeb3.tasks(uuid1);
      expect(result.content).to.be.equal(CONTENT1);
      expect(result.completed).to.be.equal(false);
    });
  });

  describe("Delete Task", () => {
    it("deletes the specified task", async () => {
      let tx = await todoWeb3.connect(deployer).deleteTask(uuid1);
      await tx.wait();
      const deletedTask = await todoWeb3.tasks(uuid1);
      expect(deletedTask.content).to.be.equal("");
      const task2 = await todoWeb3.tasks(uuid2);
      expect(task2.content).to.be.equal(CONTENT2);
    });
    it("emits a TaskDeleted event", async () => {
      await expect(todoWeb3.connect(deployer).deleteTask(uuid1))
        .to.emit(todoWeb3, "TaskDeleted")
        .withArgs(uuid1);
    });
    it("reverts if task does not exist", async () => {
      let tx = await todoWeb3.connect(deployer).deleteTask(uuid1);
      await tx.wait();
      await expect(todoWeb3.connect(deployer).deleteTask(uuid1)).to.be.revertedWith("Task already deleted");
    });
  });

  describe("Complete Task", () => {
    it("completes the task", async () => {
      let tx = await todoWeb3.connect(deployer).toggleCompleted(uuid1);
      await tx.wait();
      const result = await todoWeb3.tasks(uuid1);
      expect(result.content).to.be.equal(CONTENT1);
      expect(result.completed).to.be.equal(true);
    });
  });

  describe("Clear completed tasks", () => {
    it("clears completed tasks", async () => {
      let tx = await todoWeb3.connect(deployer).toggleCompleted(uuid1);
      await tx.wait();
      await todoWeb3.clearCompletedTasks();
      const result = await todoWeb3.tasks(uuid1);
      expect(result.content).to.be.equal("");
      const task2 = await todoWeb3.tasks(uuid2);
      expect(task2.content).to.be.equal(CONTENT2);
    });
  });
});
