## Mental Model For Testing in General

1. **Test Behavior, Not Implementation Details**  
   - Focus on *what* the code should do, not *how* it does it.

2. **Mock External Dependencies**  
   - Examples: API/network calls, SDK clients, DB connections.

3. **Never Mock Your Own Code**  
   - You are trying to test it, not replace it.

4. **Test Both Success and Failure Pathways**

5. **A Mock Replaces Behavior, Not Data**  
   - Mocks intercept **calls and imports**, not assignments.  
   - Functions are mockable because they are **invoked**.  
   - Objects/values are not mockable because they are **looked up**, not executed.

6. **Discern When to Mock vs When to Override**  
   - Example: environment variables cannot be mocked; they must be **overridden**.  
   - Mock things with **behavior**. e.g. functions, methods, classes
   - Override things with **state**. e.g. strings, numbers, objects

---

## Mental Models For Jest Testing

1. **Jest Runs Top to Bottom**  
   - Mocks must be defined **before imports**.

2. **Each Test Is Isolated**  
   - Use `beforeEach()` and `afterEach()` to set up and tear down state.

3. **Use `jest.mock()` to Mock Modules and `jest.fn()` to Create Mock Functions**

4. **Use `expect()` Assertions to Validate Behavior and Outputs**

5. **Two Ways to Attach Return Values to Mocks**  
   - **Synchronous:**  
     - `jest.fn().mockReturnValue(value)`  
     - `jest.fn(() => ({value}))`  
   - **Asynchronous:**  
     - `jest.fn().mockResolvedValue(value)`  
     - `jest.fn(async () => ({value}))`

6. **Shape Matters**  
   - The structure of mock return values must match the real implementation.  
   - Especially important for **chained calls** (e.g., `client.messages.create()`).

7. **Mock Objects and Variables via Assignment**

8. **Mock Functions Using `jest.fn()`**

9. **In Jest, Anything That Is Executed or Resolved Can Be Mocked**

---

## Mocking Decision Tree

1. **Is it a function or a class?**
   - Yes: Mock it using `jest.fn()` or `jest.mock()`.
2. **Is it a value inside a module?**
   - Yes: Mock the module using `jest.mock()`.
3. **Is it a value returned by a function?**
   - Yes: Mock the function so it returns your test value.
4. **Is it a global constant?**
   - Yes: Override it in your test setup.