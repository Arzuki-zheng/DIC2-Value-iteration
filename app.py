from flask import Flask, render_template, request, jsonify
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/value_iteration', methods=['POST'])
def value_iteration_api():
    data = request.json
    grid_size = 5
    start = tuple(data.get('start', [0, 0]))
    end = tuple(data.get('end', [4, 4]))
    blocks = [tuple(b) for b in data.get('blocks', [[1, 1], [2, 2], [3, 3]])]
    
    # Value Iteration Hyperparameters
    gamma = 0.9
    epsilon = 1e-6
    max_iterations = 1000
    
    # Initialize Value Function
    V = np.zeros((grid_size, grid_size))
    # Actions: 0: Up, 1: Down, 2: Left, 3: Right
    actions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    action_names = ['UP', 'DOWN', 'LEFT', 'RIGHT']
    
    # Reward function
    def get_reward(s):
        if s == end:
            return 100
        return -1

    # Value Iteration Loop
    for _ in range(max_iterations):
        delta = 0
        new_V = V.copy()
        for r in range(grid_size):
            for c in range(grid_size):
                curr_s = (r, c)
                if curr_s == end or curr_s in blocks:
                    continue
                
                v_list = []
                for a in actions:
                    next_r, next_c = r + a[0], c + a[1]
                    # Boundary check and block check
                    if 0 <= next_r < grid_size and 0 <= next_c < grid_size and (next_r, next_c) not in blocks:
                        v_list.append(get_reward((next_r, next_c)) + gamma * V[next_r, next_c])
                    else:
                        # Bump into wall or block - stay in place
                        v_list.append(get_reward(curr_s) + gamma * V[r, c])
                
                new_v = max(v_list)
                delta = max(delta, abs(new_v - V[r, c]))
                new_V[r, c] = new_v
        V = new_V
        if delta < epsilon:
            break

    # Derive Policy
    policy = {}
    for r in range(grid_size):
        for c in range(grid_size):
            curr_s = (r, c)
            if curr_s == end:
                policy[f"{r},{c}"] = "GOAL"
                continue
            if curr_s in blocks:
                policy[f"{r},{c}"] = "BLOCK"
                continue
                
            best_val = -float('inf')
            best_action = "RIGHT"
            for i, a in enumerate(actions):
                next_r, next_c = r + a[0], c + a[1]
                if 0 <= next_r < grid_size and 0 <= next_c < grid_size and (next_r, next_c) not in blocks:
                    val = get_reward((next_r, next_c)) + gamma * V[next_r, next_c]
                else:
                    val = get_reward(curr_s) + gamma * V[r, c]
                
                if val > best_val:
                    best_val = val
                    best_action = action_names[i]
            policy[f"{r},{c}"] = best_action

    # Convert V to list for JSON
    v_output = {}
    for r in range(grid_size):
        for c in range(grid_size):
            v_output[f"{r},{c}"] = float(V[r, c])

    return jsonify({
        "values": v_output,
        "policy": policy
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
