const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("TodoWeb3", () => {
  let todoWeb3;
  let deployer;
  const CONTENT = "Task 1";
  beforeEach(async () => {
    // Setup accounts
    [deployer] = await ethers.getSigners();

    // Deploy contract
    const TodoWeb3 = await ethers.getContractFactory("TodoWeb3");
    todoWeb3 = await TodoWeb3.deploy();

    // Create task
    let transaction = await todoWeb3.connect(deployer).createTask(CONTENT);
    await transaction.wait();
  });

  describe("Create Task", async () => {
    it("creates the task", async () => {
      const result = await todoWeb3.tasks(1);
      expect(result.content).to.be.equal(CONTENT);
      expect(result.completed).to.be.equal(false);
    });
  });


   describe("Delete Task", async () => {
    beforeEach(async () => {
      // Create a second task
      let transaction = await todoWeb3.connect(deployer).createTask("Task 2");
      await transaction.wait();
    });

    it("deletes the specified task", async () => {
      // Delete the first task
      let transaction = await todoWeb3.connect(deployer).deleteTask(1);
      await transaction.wait();

      // Fetch the deleted task
      const deletedTask = await todoWeb3.tasks(1);
      expect(deletedTask.content).to.be.equal(""); // Should be empty string after deletion

      // The second task should still exist
      const task2 = await todoWeb3.tasks(2);
      expect(task2.content).to.be.equal("Task 2");
    });

    it("emits a TaskDeleted event", async () => {
      await expect(todoWeb3.connect(deployer).deleteTask(1))
        .to.emit(todoWeb3, "TaskDeleted")
        .withArgs(1);
    });

    it("reverts if task does not exist", async () => {
      // Delete first
      let transaction = await todoWeb3.connect(deployer).deleteTask(1);
      await transaction.wait();

      // Try deleting again
      await expect(todoWeb3.connect(deployer).deleteTask(1)).to.be.revertedWith("Task already deleted");
    });
  });

  describe("Complete Task", async () => {
    // Completes task
    beforeEach(async () => {
      const transaction = await todoWeb3.connect(deployer).toggleCompleted(1);
      await transaction.wait();
    });
    it("completes the task", async () => {
      const result = await todoWeb3.tasks(1);
      expect(result.content).to.be.equal(CONTENT);
      expect(result.completed).to.be.equal(true);
    });
  });

  describe("Clear completed tasks", async () => {
    // Completes task
    beforeEach(async () => {
      let transaction = await todoWeb3.connect(deployer).createTask("Task 2");
      await transaction.wait();
      transaction = await todoWeb3.connect(deployer).toggleCompleted(1);
      await transaction.wait();
      await todoWeb3.clearCompletedTasks();
    });
    it("updates the taskCount", async () => {
      const result = await todoWeb3.taskCount();
      expect(result.toString()).to.be.equal("1");
    });
    it("updates the tasks", async () => {
      let result = await todoWeb3.tasks(1);
      console.log(result);
      result = await todoWeb3.tasks(2);
      console.log(result);
      expect(result.content).to.be.equal("Task 2");
    });
  });
});
