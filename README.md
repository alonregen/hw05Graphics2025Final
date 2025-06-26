# Interactive Basketball Shooting Game - HW6

## Team Members
- Alon Regenbogen
- Tomer leivy

## Overview
This project implements a fully interactive 3D basketball shooting game with realistic physics, complete scoring system, and comprehensive controls. Built with Three.js, it transforms a static basketball court into an engaging shooting experience.

## How to Run
1. Install dependencies: `npm install`
2. Start the server: `npm start` or `node index.js`
3. Open your browser to `http://localhost:8000`
4. Use the controls shown in the left panel to play!

## Complete Controls Implementation

### Basketball Movement Controls
- **Arrow Keys (↑↓←→)**: Move basketball around the court
  - **Camera-Relative Movement**: Movement is relative to camera's point of view
  - **Up Arrow**: Move forward (away from camera)
  - **Down Arrow**: Move backward (toward camera)
  - **Left Arrow**: Move left relative to camera
  - **Right Arrow**: Move right relative to camera
  - Smooth movement with realistic rotation animation
  - Ball stays within court boundaries
  - Rotation matches movement direction

### Shot Power System
- **W Key**: Increase shot power (0-100%)
- **S Key**: Decrease shot power (0-100%)
- Real-time visual power indicator with progress bar
- Power affects shot trajectory and distance

### Shooting Mechanics
- **SPACEBAR**: Shoot basketball toward nearest hoop
  - Calculates optimal trajectory to nearest hoop
  - Physics-based projectile motion
  - Realistic arc and gravity simulation

### Game Controls
- **R Key**: Reset basketball to center court position
- **O Key**: Toggle orbit camera controls (inherited from HW5)

### Camera Presets (Enhanced from HW5)
- **1**: Default view
- **2**: Side view (alternates between left and right sides)
- **3**: Corner view (alternates between different court corners)
- **4**: Hoop view (alternates between both basketball hoops)

## Physics System Implementation

### Realistic Gravity Simulation
- Constant downward acceleration (-9.8 m/s²)
- Parabolic trajectory calculations
- Proper arc physics for basketball shots

### Ball Movement Physics
- **Bouncing Mechanics**: Energy loss on each bounce (70% retention)
- **Ground Collision**: Realistic bounce with decreasing velocity
- **Court Boundaries**: Ball bounces off court edges
- **Velocity-Based Rotation**: Ball rotates based on movement speed and direction

### Collision Detection
- **Ground Collision**: Ball bounces when hitting court surface
- **Boundary Collision**: Ball bounces off court edges
- **Hoop Detection**: Precise scoring when ball passes through rim
- **Rim Collision**: Ball must have proper downward trajectory to score

### Shot Mechanics
- **Trajectory Calculation**: Physics-based projectile motion
- **Launch Angle**: Optimal basketball shooting angle (45-50 degrees)
- **Power Scaling**: Shot strength affects initial velocity
- **Distance Compensation**: Automatic distance calculation to target

## Comprehensive Scoring System

### Score Detection
- **Successful Shot Requirements**:
  - Ball must pass through hoop center (within 80% of rim radius)
  - Ball must be moving downward (proper arc)
  - Ball must be within rim height range
- **Point System**: 2 points per successful shot

### Statistics Tracking
- **Total Score**: Points earned from successful shots
- **Shot Attempts**: Number of times spacebar was pressed
- **Shots Made**: Number of successful shots
- **Shooting Percentage**: (Shots Made ÷ Shot Attempts) × 100%

### Visual Feedback
- **"SHOT MADE!"** message in green for successful shots
- **"MISSED SHOT"** message in red for unsuccessful attempts
- **Real-time UI updates** for all statistics
- **Animated feedback** with fade-out effects

## Basketball Rotation Animations

### Movement-Based Rotation
- Ball rotates during arrow key movement
- Rotation axis matches movement direction
- Rotation speed proportional to movement speed

### Flight Rotation
- Realistic ball rotation during flight
- Multi-axis rotation for authentic basketball movement
- Rotation speed based on ball velocity magnitude

## Enhanced User Interface

### Real-Time Game Statistics
- **Score Display**: Large, prominent score counter
- **Shot Statistics**: Attempts, makes, and accuracy percentage
- **Power Indicator**: Visual power bar with percentage

### Control Instructions
- **Complete Control Panel**: All controls clearly labeled
- **Game Instructions**: How to play guide
- **Scoring System Info**: Scoring rules and requirements

### Status Indicators
- **Camera Status**: Current camera mode
- **Ball Status**: Current power level with visual indicator
- **Game Feedback**: Real-time shot results

## Realistic Basketball Specifications

### Official Basketball Court Dimensions
- **Court Size**: 28m x 15m - regulation basketball court dimensions
- **Court Length**: 28 meters (92 feet) - standard international basketball court
- **Court Width**: 15 meters (49 feet) - standard international basketball court

### Official Basketball Equipment
- **Basketball Size**: Enhanced visibility size (15cm radius) - optimized for gameplay
- **Basketball Radius**: 15cm (0.15 meters) - larger for better visual experience
- **Hoop Height**: 3.05 meters (10 feet) - regulation basketball height
- **Rim Diameter**: Standard 18-inch (45cm) basketball rim
- **Shooting Power**: Enhanced throw strength for realistic long-distance shots

### Realistic Proportions
All game elements are scaled to match real-world basketball specifications including court dimensions, basketball size, and hoop height for an authentic playing experience.

## Technical Implementation Details

### Code Organization
- **Game State Management**: Centralized game state object
- **Physics Engine**: Separate physics update system
- **Input Handling**: Comprehensive keyboard event management
- **UI System**: Dynamic UI updates and feedback
- **Modular Design**: Separated concerns for maintainability

### Performance Optimization
- **60 FPS Target**: Smooth animation loop
- **Time-Based Physics**: Frame-rate independent physics
- **Efficient Collision Detection**: Optimized scoring detection
- **Memory Management**: Proper cleanup of temporary elements

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **WebGL Support**: Hardware-accelerated 3D rendering
- **Responsive Design**: Scales to different screen sizes

## Advanced Features Implemented

### Physics Realism
- **Energy Conservation**: Proper bounce physics with energy loss
- **Trajectory Physics**: Realistic projectile motion calculations
- **Collision Response**: Accurate collision detection and response

### Game Experience
- **Automatic Targeting**: Shoots toward nearest hoop
- **Boundary Constraints**: Ball stays within court
- **Smooth Animations**: Fluid movement and rotation
- **Visual Polish**: Professional UI design and feedback

### Interactive Elements
- **Real-Time Power Adjustment**: Live power indicator
- **Instant Feedback**: Immediate shot result notifications
- **Statistics Tracking**: Comprehensive performance metrics

## Known Issues and Limitations
- Score detection requires precise aim through hoop center
- Ball physics optimized for realistic gameplay over perfect simulation
- Camera controls maintain HW5 functionality alongside new features

## Sources and Assets
- **Three.js Library**: 3D graphics rendering
- **OrbitControls**: Camera control system (from Three.js examples)
- **Basketball Textures**: Custom seam patterns
- **Court Design**: Standard basketball court specifications
- **Physics Calculations**: Based on real basketball trajectory physics

## Screenshots
Screenshots are available in the `/screenshots` directory showing:
- Basketball movement and controls
- Shot power adjustment
- Successful scoring mechanics
- Complete UI with statistics
- Ball rotation animations during gameplay

## Development Process
This implementation follows the specified phases:
1. ✅ Basic Movement Controls - Arrow key basketball positioning
2. ✅ Shot Power System - W/S power adjustment with visual feedback
3. ✅ Physics and Shooting - Gravity, trajectory, and spacebar shooting
4. ✅ Collision and Bouncing - Ground/boundary collision with energy loss
5. ✅ Rotation Animation - Movement and flight-based ball rotation
6. ✅ Scoring System - Accurate score detection and statistics
7. ✅ UI Enhancement - Complete statistics and control interface

## Final Testing Checklist Status
✅ Basketball moves smoothly with arrow keys in all directions  
✅ W/S keys adjust shot power with visual feedback  
✅ Spacebar shoots basketball toward hoop with proper trajectory  
✅ R key resets basketball to center court  
✅ Basketball bounces realistically when hitting the ground  
✅ Ball rotates correctly during movement and flight  
✅ Successful shots are detected and score is updated  
✅ Shot attempts and accuracy percentage are tracked  
✅ UI displays all required information clearly  
✅ All controls work as specified without errors

This implementation successfully transforms the HW5 basketball court infrastructure into a fully interactive shooting game meeting all HW6 requirements.
