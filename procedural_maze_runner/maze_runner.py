# Import necessary libraries
import pygame
import sys
import random
import numpy as np
import time
import math
from collections import deque

print("Script started. Importing modules...") # DIAGNOSTIC

# --- Constants ---
# (Constants remain the same as the previous version)
SCREEN_WIDTH = 800; SCREEN_HEIGHT = 600; WINDOW_TITLE = "Procedural Maze Runner - Debug"
COLOR_BLACK=(0,0,0); COLOR_WHITE=(255,255,255); COLOR_DARK_BLUE=(0,0,50); COLOR_DARK_GREY=(40,40,40)
COLOR_GREEN=(0,255,0); COLOR_RED=(255,0,0); COLOR_CYAN=(0,255,255); COLOR_PURPLE=(128,0,128)
COLOR_YELLOW=(255,255,0); COLOR_GREY=(128,128,128); COLOR_ORANGE=(255,165,0); COLOR_DIM_OVERLAY=(0,0,0,180)
BACKGROUND_COLOR=COLOR_BLACK; WALL_COLOR=COLOR_WHITE; VISITED_CELL_COLOR=COLOR_DARK_BLUE
CURRENT_CELL_MARKER_COLOR=COLOR_GREEN; PLAYER_COLOR=COLOR_CYAN; START_COLOR=COLOR_PURPLE
END_COLOR=COLOR_RED; TIMER_COLOR=COLOR_ORANGE; HINT_PATH_COLOR=COLOR_YELLOW; FOG_COLOR=COLOR_DARK_GREY

# --- Game Settings Structure ---
ALGORITHM_RECURSIVE_BACKTRACK="Recursive Backtrack"; ALGORITHM_PRIMS="Prim's"
ALGORITHM_CHOICES=[ALGORITHM_RECURSIVE_BACKTRACK, ALGORITHM_PRIMS]
SETTINGS_OPTIONS=["Difficulty", "Timer", "Fog of War", "Hints", "Algorithm", "Back"]
settings_menu_selection_index = 0
game_settings={"difficulty":"Medium", "timer_enabled":False, "fog_enabled":False, "hints_enabled":True, "algorithm":ALGORITHM_RECURSIVE_BACKTRACK}
DIFFICULTY_MAP={"Easy":1, "Medium":2, "Hard":3}; DIFFICULTY_LEVELS=["Easy", "Medium", "Hard"]
DIFFICULTY_SETTINGS_MAP = {
    "Easy":{'cols':20,'rows':15,'cell_size':40,'time_factor':2.0,'fog_radius':7,'hint_base_ms':3000},
    "Medium":{'cols':40,'rows':30,'cell_size':20,'time_factor':1.0,'fog_radius':5,'hint_base_ms':2000},
    "Hard":{'cols':80,'rows':60,'cell_size':10,'time_factor':0.6,'fog_radius':4,'hint_base_ms':1500}
}
grid_cols=DIFFICULTY_SETTINGS_MAP[game_settings["difficulty"]]['cols']; grid_rows=DIFFICULTY_SETTINGS_MAP[game_settings["difficulty"]]['rows']
cell_size=DIFFICULTY_SETTINGS_MAP[game_settings["difficulty"]]['cell_size']; fog_radius=DIFFICULTY_SETTINGS_MAP[game_settings["difficulty"]]['fog_radius']
hint_duration_ms=DIFFICULTY_SETTINGS_MAP[game_settings["difficulty"]]['hint_base_ms']

# Game states
STATE_MENU=0; STATE_SETTINGS=1; STATE_GENERATING=2; STATE_PLAYING=3; STATE_WON=4; STATE_LOST=5; STATE_PAUSED=6

# --- Audio Settings ---
SAMPLE_RATE = 44100; AUDIO_BUFFER_SIZE = 1024; AMBIENCE_CHANNEL_NUM = 0

# --- Sound Generation --- (Functions Unchanged - Assume OK unless error points here)
def generate_sine_wave(f, d, sr=SAMPLE_RATE, a=0.3):
    t = np.linspace(0., d, int(sr * d), endpoint=False)
    w = a * np.sin(2. * np.pi * f * t)
    p = (w * 32767).astype(np.int16)
    return np.column_stack((p, p))
def generate_square_wave(f, d, sr=SAMPLE_RATE, a=0.2):
    t = np.linspace(0., d, int(sr * d), endpoint=False)
    w = a * np.sign(np.sin(2. * np.pi * f * t))
    p = (w * 32767).astype(np.int16)
    return np.column_stack((p, p))
def generate_noise(d, sr=SAMPLE_RATE, a=0.15):
    n = int(sr * d)
    w = a * (2 * np.random.random(n) - 1)
    p = (w * 32767).astype(np.int16)
    return np.column_stack((p, p))
def generate_slow_sine_mod(base_freq, mod_freq, mod_depth, duration, sr=SAMPLE_RATE, a=0.1):
    t = np.linspace(0., duration, int(sr * duration), endpoint=False)
    mod_wave = mod_depth * np.sin(2. * np.pi * mod_freq * t)
    main_wave = a * np.sin(2. * np.pi * (base_freq + mod_wave) * t)
    pcm_wave = (main_wave * 32767).astype(np.int16)
    return np.column_stack((pcm_wave, pcm_wave))
def generate_combined_wave(wl):
    return np.concatenate(wl, axis=0)

# --- Pathfinding (BFS) --- (Function Unchanged - Assume OK unless error points here)
def find_path_bfs(maze, start_coords, end_coords):
    q = deque([(start_coords, [start_coords])])
    visited = {start_coords}
    while q:
        (x, y), path = q.popleft()
        if (x, y) == end_coords:
            return path
        curr = maze.grid[y][x]
        moves = []
        if not curr.walls['N']:
            moves.append((x, y - 1))
        if not curr.walls['S']:
            moves.append((x, y + 1))
        if not curr.walls['E']:
            moves.append((x + 1, y))
        if not curr.walls['W']:
            moves.append((x - 1, y))
        for nx, ny in moves:
            if 0 <= nx < maze.grid_cols and 0 <= ny < maze.grid_rows:
                n_coords = (nx, ny)
                if n_coords not in visited:
                    visited.add(n_coords)
                    new_path = list(path)
                    new_path.append(n_coords)
                    q.append((n_coords, new_path))
    return None

# --- Classes (Cell, Maze, Player) --- (Unchanged - Assume OK unless error points here)
class Cell:
    def __init__(self, x, y):
        self.x, self.y = x, y
        self.walls = {'N': True, 'S': True, 'E': True, 'W': True}
        self.visited_gen = False
        self.visited_frame = 0
    def draw(self, screen, cell_size, wall_color):
        x1, y1 = self.x * cell_size, self.y * cell_size
        x2, y2 = x1 + cell_size, y1 + cell_size
        s = screen
        wc = wall_color
        if self.walls['N']: pygame.draw.line(s, wc, (x1, y1), (x2, y1))
        if self.walls['S']: pygame.draw.line(s, wc, (x1, y2), (x2, y2))
        if self.walls['E']: pygame.draw.line(s, wc, (x2, y1), (x2, y2))
        if self.walls['W']: pygame.draw.line(s, wc, (x1, y1), (x1, y2))
    def get_neighbours(self, grid, grid_cols, grid_rows):
        n = []
        c = [('N', self.x, self.y - 1), ('S', self.x, self.y + 1), ('E', self.x + 1, self.y), ('W', self.x - 1, self.y)]
        for _, nx, ny in c:
            if 0 <= nx < grid_cols and 0 <= ny < grid_rows:
                n.append(grid[ny][nx])
        return n
    def __repr__(self):
        return f"Cell({self.x},{self.y})"
class Maze:
    def __init__(self, grid_cols, grid_rows, cell_size):
        self.grid_cols, self.grid_rows, self.cell_size = grid_cols, grid_rows, cell_size
        self.grid = self._initialize_grid()
        self.generation_stack = []
        self.frontier = []
        self.current_gen_cell = None
        self.start_pos = (0, 0)
        self.end_pos = (grid_cols - 1, grid_rows - 1)
    def _initialize_grid(self):
        return [[Cell(x, y) for x in range(self.grid_cols)] for y in range(self.grid_rows)]
    def reset_grid(self):
        print("Resetting grid...")
        [c.__init__(c.x, c.y) for r in self.grid for c in r] # List comprehension for side effect (resetting cells)
        self.generation_stack = []
        self.frontier = []
        self.current_gen_cell = None # Simplified reset
    def _remove_walls(self, c1, c2):
        dx, dy = c1.x - c2.x, c1.y - c2.y
        if dx == 1: c1.walls['W'], c2.walls['E'] = False, False
        elif dx == -1: c1.walls['E'], c2.walls['W'] = False, False
        if dy == 1: c1.walls['N'], c2.walls['S'] = False, False
        elif dy == -1: c1.walls['S'], c2.walls['N'] = False, False
    def start_generation_rb(self):
        self.reset_grid()
        sx, sy = self.start_pos
        self.current_gen_cell = self.grid[sy][sx] if 0 <= sx < self.grid_cols and 0 <= sy < self.grid_rows else self.grid[0][0]
        self.current_gen_cell.visited_gen = True
        self.generation_stack.append(self.current_gen_cell)
        self.end_pos = (self.grid_cols - 1, self.grid_rows - 1)
        print(f"Starting RB Gen from ({self.current_gen_cell.x},{self.current_gen_cell.y})")
    def generate_step_rb(self):
        if not self.generation_stack:
            self.current_gen_cell = None
            return False
        self.current_gen_cell = self.generation_stack[-1]
        unvisited = [n for n in self.current_gen_cell.get_neighbours(self.grid, self.grid_cols, self.grid_rows) if not n.visited_gen]
        if unvisited:
            nxt = random.choice(unvisited)
            self._remove_walls(self.current_gen_cell, nxt)
            nxt.visited_gen = True
            self.generation_stack.append(nxt)
        else:
            self.generation_stack.pop()
        return True
    def _add_walls_to_frontier(self, cell):
        for _, dx, dy in [('N', 0, -1), ('S', 0, 1), ('E', 1, 0), ('W', -1, 0)]:
            nx, ny = cell.x + dx, cell.y + dy
            if 0 <= nx < self.grid_cols and 0 <= ny < self.grid_rows:
                n = self.grid[ny][nx]
                wt = (cell, n)
                if wt not in self.frontier and (n, cell) not in self.frontier:
                    self.frontier.append(wt)
    def start_generation_prims(self):
        self.reset_grid()
        sx, sy = self.start_pos
        sc = self.grid[sy][sx] if 0 <= sx < self.grid_cols and 0 <= sy < self.grid_rows else self.grid[0][0]
        sc.visited_gen = True
        self._add_walls_to_frontier(sc)
        self.end_pos = (self.grid_cols - 1, self.grid_rows - 1)
        self.current_gen_cell = sc
        print(f"Starting Prim's Gen from ({sc.x},{sc.y})")
    def generate_step_prims(self):
        if not self.frontier:
            self.current_gen_cell = None
            return False
        c1, c2 = random.choice(self.frontier)
        self.frontier.remove((c1, c2))
        if c1.visited_gen ^ c2.visited_gen:
            self._remove_walls(c1, c2)
            nc = c1 if not c1.visited_gen else c2
            nc.visited_gen = True
            self._add_walls_to_frontier(nc)
            self.current_gen_cell = nc
        return True
    def draw(self, screen, wall_color, start_color, end_color, player_pos, fog_enabled, fog_radius, frame_count, hint_path, hint_path_color):
        px, py = player_pos
        bg = FOG_COLOR if fog_enabled else BACKGROUND_COLOR
        screen.fill(bg)
        r_sq = fog_radius**2
        for y in range(self.grid_rows):
            for x in range(self.grid_cols):
                c = self.grid[y][x]
                vis = False
                d_sq = (x - px)**2 + (y - py)**2
                if not fog_enabled or d_sq <= r_sq:
                    vis = True
                    c.visited_frame = frame_count
                draw = vis or (fog_enabled and frame_count - c.visited_frame <= 2)
                if draw:
                    cc = (x, y)
                    hint = hint_path and cc in hint_path
                    if fog_enabled or hint:
                        bgc = hint_path_color if hint else BACKGROUND_COLOR
                        pygame.draw.rect(screen, bgc, (x * self.cell_size, y * self.cell_size, self.cell_size, self.cell_size))
                    if vis:
                        c.draw(screen, self.cell_size, wall_color)
                        inset = max(1, self.cell_size // 10)
                        size = self.cell_size - 2 * inset
                        if cc == self.start_pos:
                            pygame.draw.rect(screen, start_color, (x * self.cell_size + inset, y * self.cell_size + inset, size, size))
                        elif cc == self.end_pos:
                            pygame.draw.rect(screen, end_color, (x * self.cell_size + inset, y * self.cell_size + inset, size, size))
    def draw_generation_overlay(self, screen, visited_color, current_marker_color):
        for r in self.grid:
            for c in r:
                if c.visited_gen:
                    pygame.draw.rect(screen, visited_color, (c.x * self.cell_size, c.y * self.cell_size, self.cell_size, self.cell_size))
        if self.current_gen_cell:
            x, y = self.current_gen_cell.x, self.current_gen_cell.y
            inset = max(1, self.cell_size // 5)
            pygame.draw.rect(screen, current_marker_color, (x * self.cell_size + inset, y * self.cell_size + inset, self.cell_size - 2 * inset, self.cell_size - 2 * inset))
class Player:
    def __init__(self, x, y, cell_size, color):
        self.x, self.y = x, y
        self.cell_size = cell_size
        self.color = color
        self.update_pixel_pos()
        self.radius = max(3, int(self.cell_size * 0.30))
    def update_pixel_pos(self):
        self.pixel_x = self.x * self.cell_size + self.cell_size // 2
        self.pixel_y = self.y * self.cell_size + self.cell_size // 2
    def draw(self, screen):
        pygame.draw.circle(screen, self.color, (self.pixel_x, self.pixel_y), self.radius)
    def move(self, dx, dy, maze, sounds):
        curr = maze.grid[self.y][self.x]
        move = False
        if dx == 1 and not curr.walls['E']: move = True
        elif dx == -1 and not curr.walls['W']: move = True
        elif dy == 1 and not curr.walls['S']: move = True
        elif dy == -1 and not curr.walls['N']: move = True
        if move:
            self.x += dx
            self.y += dy
            self.update_pixel_pos()
            sounds['move'].play()
            return True
        else:
            sounds['hit_wall'].play()
            return False

# --- Helper Functions ---
def draw_text(screen, text, size, x, y, color, align="midtop"):
    try:
        font = pygame.font.Font(None, size)
        surf = font.render(text, True, color)
        rect = surf.get_rect()
        setattr(rect, align, (x, y))
        screen.blit(surf, rect) # Simplified alignment
    except Exception as e:
        print(f"Error drawing text '{text}': {e}")

# --- Dim Surface ---
dim_surface = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA); dim_surface.fill(COLOR_DIM_OVERLAY)

# --- Pygame Setup ---
print("Initializing Pygame...")
screen = None # Initialize screen to None
ambience_channel = None
try:
    print(" Pre-initializing Mixer...")
    pygame.mixer.pre_init(SAMPLE_RATE, -16, 2, AUDIO_BUFFER_SIZE)
    print(" Initializing Pygame Core...")
    pygame.init() # Initialize all Pygame modules
    print(" Initializing Font...")
    pygame.font.init() # Explicitly initialize font
    print(" Setting Mixer Channels...")
    pygame.mixer.set_num_channels(8)
    print(" Getting Ambience Channel...")
    ambience_channel = pygame.mixer.Channel(AMBIENCE_CHANNEL_NUM)
    print(" Setting Display Mode...")
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    print(" Setting Caption...")
    pygame.display.set_caption(WINDOW_TITLE)
    print(" Creating Clock...")
    clock = pygame.time.Clock()
    print(" Pygame initialized successfully.")
except Exception as e:
    print(f"Fatal Error initializing Pygame: {e}")
    # Attempt cleanup even if initialization failed partially
    if pygame.mixer.get_init(): pygame.mixer.quit()
    if pygame.font.get_init(): pygame.font.quit()
    if pygame.get_init(): pygame.quit()
    sys.exit() # Exit if Pygame cannot initialize

# --- Generate Sound Assets ---
print("Generating sound assets...")
sounds = {}
try:
    # (Sound generation code remains the same, ensure amplitudes are reasonable)
    sounds['select'] = pygame.sndarray.make_sound(generate_sine_wave(660, 0.05, a=0.2)); sounds['move'] = pygame.sndarray.make_sound(generate_square_wave(220, 0.04, a=0.15)); sounds['hit_wall'] = pygame.sndarray.make_sound(generate_noise(0.06, a=0.08))
    win1=generate_sine_wave(261.63,0.10,a=0.3); win2=generate_sine_wave(329.63,0.10,a=0.3); win3=generate_sine_wave(392.00,0.15,a=0.3); sounds['win'] = pygame.sndarray.make_sound(generate_combined_wave([win1,win2,win3]))
    sounds['start_game'] = pygame.sndarray.make_sound(generate_sine_wave(440, 0.2, a=0.25))
    lose1=generate_sine_wave(196.00,0.15,a=0.3); lose2=generate_sine_wave(164.81,0.15,a=0.3); lose3=generate_sine_wave(130.81,0.20,a=0.3); sounds['lose'] = pygame.sndarray.make_sound(generate_combined_wave([lose1,lose2,lose3]))
    sounds['hint'] = pygame.sndarray.make_sound(generate_sine_wave(880, 0.15, a=0.2))
    sounds['ambience'] = pygame.sndarray.make_sound(generate_slow_sine_mod(base_freq=40, mod_freq=0.1, mod_depth=5, duration=15.0, a=0.05))
    print("Sound assets generated successfully.")
except Exception as e:
    print(f"Error generating sounds: {e}. Using dummy sounds.")
    sound_keys = ['select','move','hit_wall','win','start_game','lose','hint','ambience']
    dummy_sound_data = np.zeros((100, 2), dtype=np.int16)
    dummy_sound = pygame.sndarray.make_sound(dummy_sound_data)
    sounds = {k: dummy_sound for k in sound_keys}


# --- Game Objects and State Variables ---
maze = None; player = None; game_state = STATE_MENU; paused_from_state = None
timer_start_ticks = 0; time_limit_seconds = 0; pause_start_ticks = 0; total_paused_time = 0
frame_counter = 0; hint_path = None; hint_timer_end = 0

# --- Function to Start a New Game --- (Unchanged)
def start_new_game():
    global maze, player, game_state, grid_cols, grid_rows, cell_size, fog_radius, hint_duration_ms, timer_start_ticks, time_limit_seconds, total_paused_time, paused_from_state, hint_path, hint_timer_end
    difficulty_str = game_settings["difficulty"]
    settings = DIFFICULTY_SETTINGS_MAP[difficulty_str]
    grid_cols, grid_rows, cell_size = settings['cols'], settings['rows'], settings['cell_size']
    time_factor = settings['time_factor']
    fog_radius = settings['fog_radius']
    hint_duration_ms = settings['hint_base_ms']
    print(f"Starting: {difficulty_str}, {grid_cols}x{grid_rows}, Algo={game_settings['algorithm']}, Timer={game_settings['timer_enabled']}, Fog={game_settings['fog_enabled']}, Hints={game_settings['hints_enabled']}")
    maze = Maze(grid_cols, grid_rows, cell_size)
    player = None
    game_state = STATE_GENERATING
    if game_settings['timer_enabled']:
        base_time = 5
        time_per_cell = 0.1
        time_limit_seconds = base_time + (grid_cols * grid_rows * time_per_cell * time_factor)
        print(f"Time limit: {time_limit_seconds:.1f}s")
    else:
        time_limit_seconds = 0
    timer_start_ticks = 0
    total_paused_time = 0
    paused_from_state = None
    hint_path = None
    hint_timer_end = 0
    algo_func = maze.start_generation_prims if game_settings["algorithm"] == ALGORITHM_PRIMS else maze.start_generation_rb
    algo_func()
    ambience_channel.stop()

# --- Main Game Loop ---
print("Starting main game loop...")
running = True
try: # Wrap main loop in try...except
    while running:
        # Timekeeping
        current_ticks = pygame.time.get_ticks()
        delta_time_ms = clock.tick(60) # Limit FPS, get ms since last frame
        frame_counter = (frame_counter + 1) % 3600 # Increment and wrap frame counter

        # --- Event Handling ---
        events = pygame.event.get()
        for event in events:
            if event.type == pygame.QUIT: running = False
            if event.type == pygame.KEYDOWN:
                # --- State-Specific Input Handling ---
                # (Input logic remains the same as the previous version)
                if game_state == STATE_MENU:
                    if event.key == pygame.K_s:
                        game_state = STATE_SETTINGS
                        paused_from_state = STATE_MENU
                        settings_menu_selection_index = 0
                        sounds['select'].play()
                    # elif event.key in (pygame.K_RETURN, pygame.K_SPACE): # Defer this to after drawing
                    #     sounds['select'].play()
                    #     time.sleep(0.05)
                    #     start_new_game()
                    elif event.key == pygame.K_ESCAPE:
                        running = False
                    # Add a flag to start game *after* drawing the menu once
                    elif event.key in (pygame.K_RETURN, pygame.K_SPACE):
                         start_game_requested = True # Set a flag instead of starting immediately
                elif game_state == STATE_SETTINGS:
                    if event.key == pygame.K_UP:
                        settings_menu_selection_index = (settings_menu_selection_index - 1) % len(SETTINGS_OPTIONS)
                        sounds['select'].play()
                    elif event.key == pygame.K_DOWN:
                        settings_menu_selection_index = (settings_menu_selection_index + 1) % len(SETTINGS_OPTIONS)
                        sounds['select'].play()
                    elif event.key in (pygame.K_RETURN, pygame.K_SPACE, pygame.K_LEFT, pygame.K_RIGHT):
                        option = SETTINGS_OPTIONS[settings_menu_selection_index]
                        changed = False
                        direction = 1 if event.key != pygame.K_LEFT else -1
                        if option == "Difficulty":
                            idx = DIFFICULTY_LEVELS.index(game_settings["difficulty"])
                            game_settings["difficulty"] = DIFFICULTY_LEVELS[(idx + direction) % len(DIFFICULTY_LEVELS)]
                            changed = True
                        elif option == "Timer":
                            game_settings["timer_enabled"] = not game_settings["timer_enabled"]
                            changed = True
                        elif option == "Fog of War":
                            game_settings["fog_enabled"] = not game_settings["fog_enabled"]
                            changed = True
                        elif option == "Hints":
                            game_settings["hints_enabled"] = not game_settings["hints_enabled"]
                            changed = True
                        elif option == "Algorithm":
                            idx = ALGORITHM_CHOICES.index(game_settings["algorithm"])
                            game_settings["algorithm"] = ALGORITHM_CHOICES[(idx + direction) % len(ALGORITHM_CHOICES)]
                            changed = True
                        elif option == "Back":
                            game_state = paused_from_state if paused_from_state is not None else STATE_MENU
                            changed = True
                        if changed:
                            sounds['select'].play()
                    elif event.key in (pygame.K_ESCAPE, pygame.K_b):
                        game_state = paused_from_state if paused_from_state is not None else STATE_MENU
                        sounds['select'].play()
                elif game_state == STATE_PLAYING:
                    if event.key == pygame.K_ESCAPE:
                        game_state = STATE_PAUSED
                        paused_from_state = STATE_PLAYING
                        pause_start_ticks = current_ticks
                        print("Paused")
                        ambience_channel.pause()
                    elif event.key == pygame.K_h and game_settings["hints_enabled"] and player and maze and not hint_path:
                        print("Hint key...")
                        path = find_path_bfs(maze, (player.x, player.y), maze.end_pos)
                        if path:
                            hint_path = path
                            hint_timer_end = current_ticks + hint_duration_ms
                            sounds['hint'].play()
                            print(f"Hint found ({len(path)}). Show: {hint_duration_ms / 1000.0:.1f}s.")
                        else:
                            print("Hint path not found.")
                    elif player: # Movement
                        moved = False
                        if event.key in (pygame.K_UP, pygame.K_w): moved = player.move(0, -1, maze, sounds)
                        elif event.key in (pygame.K_DOWN, pygame.K_s): moved = player.move(0, 1, maze, sounds)
                        elif event.key in (pygame.K_LEFT, pygame.K_a): moved = player.move(-1, 0, maze, sounds)
                        elif event.key in (pygame.K_RIGHT, pygame.K_d): moved = player.move(1, 0, maze, sounds)
                        if moved and (player.x, player.y) == maze.end_pos:
                            print("Win!")
                            sounds['win'].play()
                            game_state = STATE_WON
                            ambience_channel.stop()
                elif game_state == STATE_PAUSED:
                    if event.key in (pygame.K_ESCAPE, pygame.K_r):
                        if paused_from_state == STATE_PLAYING:
                            game_state = STATE_PLAYING
                            p_dur = current_ticks - pause_start_ticks
                            total_paused_time += p_dur
                            print(f"Resumed. Paused: {p_dur / 1000.0:.1f}s")
                            sounds['select'].play()
                            ambience_channel.unpause()
                        else:
                            game_state = STATE_MENU
                            sounds['select'].play()
                            ambience_channel.stop()
                    elif event.key == pygame.K_s:
                        game_state = STATE_SETTINGS
                        paused_from_state = STATE_PAUSED
                        settings_menu_selection_index = 0
                        sounds['select'].play()
                    elif event.key == pygame.K_m:
                        game_state = STATE_MENU
                        paused_from_state = None
                        sounds['select'].play()
                        ambience_channel.stop()
                    elif event.key == pygame.K_q:
                        running = False
                elif game_state in (STATE_WON, STATE_LOST):
                    if event.key in (pygame.K_r, pygame.K_RETURN, pygame.K_SPACE):
                        sounds['select'].play()
                        time.sleep(0.05)
                        start_new_game()
                    elif event.key == pygame.K_m:
                        game_state = STATE_MENU
                        paused_from_state = None
                        sounds['select'].play()
                    elif event.key == pygame.K_ESCAPE:
                        running = False

        # --- Input Processing (Post-Event Loop) ---
        # Handle state changes triggered by flags set in the event loop
        if game_state == STATE_MENU and 'start_game_requested' in locals() and start_game_requested:
            sounds['select'].play()
            time.sleep(0.05)
            start_new_game()
            start_game_requested = False # Reset flag


        # --- Game Logic ---
        if game_state == STATE_GENERATING:
            if maze:
                gen_func = maze.generate_step_prims if game_settings["algorithm"] == ALGORITHM_PRIMS else maze.generate_step_rb
                if not gen_func():
                    game_state = STATE_PLAYING
                    print("Gen finished -> PLAYING.")
                    sx, sy = maze.start_pos
                    player = Player(sx, sy, maze.cell_size, PLAYER_COLOR)
                    print(f"Player at ({sx},{sy})")
                    sounds['start_game'].play()
                    timer_start_ticks = current_ticks
                    total_paused_time = 0
                    hint_path = None
                    hint_timer_end = 0
                    if not ambience_channel.get_busy():
                        ambience_channel.play(sounds['ambience'], loops=-1)
            else:
                game_state = STATE_MENU # Error case
        elif game_state == STATE_PLAYING:
            if game_settings['timer_enabled']: # Timer Update
                eff_start = timer_start_ticks + total_paused_time
                elapsed = (current_ticks - eff_start) / 1000.0
                if time_limit_seconds > 0 and elapsed >= time_limit_seconds:
                    print("Time up!")
                    sounds['lose'].play()
                    game_state = STATE_LOST
                    ambience_channel.stop()
            if hint_path and current_ticks >= hint_timer_end:
                hint_path = None
                print("Hint expired.") # Hint Timer
            if not ambience_channel.get_busy():
                ambience_channel.play(sounds['ambience'], loops=-1) # Keep ambience playing

        # --- Drawing ---
        if screen: # Check if screen was initialized
            # Base drawing (Maze and Player)
            if game_state in [STATE_GENERATING, STATE_PLAYING, STATE_PAUSED, STATE_WON, STATE_LOST]:
                player_coords = (player.x, player.y) if player else (0,0)
                active_hint_path = hint_path if game_state == STATE_PLAYING and hint_path and current_ticks < hint_timer_end else None
                if maze: maze.draw(screen, WALL_COLOR, START_COLOR, END_COLOR, player_coords, game_settings["fog_enabled"], fog_radius, frame_counter, active_hint_path, HINT_PATH_COLOR)
                if player and game_state != STATE_GENERATING: player.draw(screen)

            # Draw overlays / menus on top
            if game_state == STATE_GENERATING:
                if maze:
                    maze.draw_generation_overlay(screen, VISITED_CELL_COLOR, CURRENT_CELL_MARKER_COLOR)
                draw_text(screen, f"Generating ({game_settings['algorithm']})...", 24, SCREEN_WIDTH // 2, 10, COLOR_WHITE)
            elif game_state == STATE_PLAYING:
                if game_settings['timer_enabled'] and time_limit_seconds > 0:
                    eff_start = timer_start_ticks + total_paused_time
                    elapsed = (current_ticks - eff_start) / 1000.0
                    remaining = max(0, time_limit_seconds - elapsed)
                    draw_text(screen, f"Time: {remaining:.1f}", 30, SCREEN_WIDTH - 10, 10, TIMER_COLOR, align="topright")
                hint_text = "[H] Hint" if game_settings["hints_enabled"] else ""
                draw_text(screen, hint_text, 20, 10, SCREEN_HEIGHT - 30, COLOR_GREY, align="topleft")
                draw_text(screen, "[Esc] Pause", 20, SCREEN_WIDTH - 10, SCREEN_HEIGHT - 30, COLOR_GREY, align="topright")
            elif game_state == STATE_PAUSED:
                screen.blit(dim_surface, (0, 0))
                draw_text(screen, "Paused", 60, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 4, COLOR_WHITE)
                draw_text(screen, "[R/Esc] Resume", 36, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 60, COLOR_WHITE)
                draw_text(screen, "[S] Settings", 36, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 10, COLOR_WHITE)
                draw_text(screen, "[M] Main Menu", 36, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 40, COLOR_WHITE)
                draw_text(screen, "[Q] Quit Game", 36, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 90, COLOR_WHITE)
            elif game_state == STATE_SETTINGS:
                screen.fill(BACKGROUND_COLOR)
                draw_text(screen, "Settings", 48, SCREEN_WIDTH // 2, 50, COLOR_WHITE)
                y_pos = 120
                option_gap = 40
                for i, option_name in enumerate(SETTINGS_OPTIONS):
                    prefix = "> " if i == settings_menu_selection_index else "  "
                    text_color = COLOR_YELLOW if i == settings_menu_selection_index else COLOR_WHITE
                    if option_name == "Difficulty":
                        display_text = f"{prefix}Difficulty: [{game_settings['difficulty']}]"
                    elif option_name == "Timer":
                        status = "On" if game_settings['timer_enabled'] else "Off"
                        display_text = f"{prefix}Timer: [{status}]"
                        text_color = (COLOR_GREEN if game_settings['timer_enabled'] else COLOR_RED) if i != settings_menu_selection_index else COLOR_YELLOW
                    elif option_name == "Fog of War":
                        status = "On" if game_settings['fog_enabled'] else "Off"
                        display_text = f"{prefix}Fog of War: [{status}]"
                        text_color = (COLOR_GREEN if game_settings['fog_enabled'] else COLOR_RED) if i != settings_menu_selection_index else COLOR_YELLOW
                    elif option_name == "Hints":
                        status = "On" if game_settings['hints_enabled'] else "Off"
                        display_text = f"{prefix}Hints: [{status}]"
                        text_color = (COLOR_GREEN if game_settings['hints_enabled'] else COLOR_RED) if i != settings_menu_selection_index else COLOR_YELLOW
                    elif option_name == "Algorithm":
                        display_text = f"{prefix}Algorithm: [{game_settings['algorithm']}]"
                    elif option_name == "Back":
                        display_text = f"{prefix}Back to {'Pause Menu' if paused_from_state == STATE_PAUSED else 'Main Menu'}"
                        y_pos += option_gap
                    else:
                        display_text = f"{prefix}{option_name}"
                    draw_text(screen, display_text, 30, SCREEN_WIDTH // 2, y_pos, text_color)
                    y_pos += option_gap
                draw_text(screen, "(Arrows: Nav / Enter,Left,Right: Change)", 22, SCREEN_WIDTH // 2, SCREEN_HEIGHT - 50, COLOR_GREY)
            elif game_state == STATE_WON:
                draw_text(screen, "-- You Win! --", 74, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 3, COLOR_GREEN)
                draw_text(screen, "[Enter/Space/R] Play Again", 30, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2, COLOR_WHITE)
                draw_text(screen, "[M] Main Menu  [Esc] Quit", 24, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 40, COLOR_WHITE)
            elif game_state == STATE_LOST:
                draw_text(screen, "-- Time's Up! --", 74, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 3, COLOR_RED)
                draw_text(screen, "[Enter/Space/R] Try Again", 30, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2, COLOR_WHITE)
                draw_text(screen, "[M] Main Menu  [Esc] Quit", 24, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 40, COLOR_WHITE)
            elif game_state == STATE_MENU:
                draw_text(screen, "Maze Runner", 64, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 4, COLOR_WHITE)
                draw_text(screen, "[Enter/Space] Start Game", 36, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2, COLOR_WHITE)
                draw_text(screen, "[S] Settings", 36, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50, COLOR_WHITE)
                draw_text(screen, "[Esc] Quit", 36, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 100, COLOR_WHITE)

            # Update Display
            print(f"Drawing State: {game_state} - Flipping display...") # DIAGNOSTIC PRINT
            pygame.display.flip() # Make drawn frame visible
        else:
            print("Error: Screen surface not available for drawing.")
            running = False # Stop loop if screen is gone

except Exception as e:
    # Catch any unexpected error during the main loop
    print("\n--- UNEXPECTED ERROR IN MAIN LOOP ---")
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {e}")
    import traceback
    traceback.print_exc() # Print detailed traceback
    print("------------------------------------")
    running = False # Ensure loop exits on error

# --- Cleanup ---
print("Exiting...")
# Stop mixer first to avoid potential hangs
if pygame.mixer.get_init():
    print(" Quitting Mixer...")
    pygame.mixer.quit()
# Quit other modules
if pygame.font.get_init():
    print(" Quitting Font...")
    pygame.font.quit()
print(" Quitting Pygame Core...")
pygame.quit()
print(" Exiting Script.")
sys.exit()
