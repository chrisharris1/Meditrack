# PERT Chart - MediTrack Project
## Project: Medical Tracking and Management System

### 1. Project Overview
**Project Name:** MediTrack - Medical Tracking and Management System  
**Project Duration:** 16 weeks  
**Start Date:** Week 1  
**End Date:** Week 16  

### 2. Activity List and Time Estimates

| Activity ID | Activity Description | Optimistic (a) | Most Likely (m) | Pessimistic (b) | Expected Time (te) | Variance (σ²) |
|-------------|---------------------|----------------|-----------------|-----------------|-------------------|---------------|
| A | Project Planning & Requirements Gathering | 1 | 2 | 3 | 2.0 | 0.11 |
| B | System Analysis & Design | 2 | 3 | 5 | 3.2 | 0.25 |
| C | Database Design | 1 | 2 | 4 | 2.2 | 0.25 |
| D | User Interface Design | 2 | 3 | 4 | 3.0 | 0.11 |
| E | Backend Development Setup | 1 | 1 | 2 | 1.2 | 0.03 |
| F | User Authentication Module | 1 | 2 | 3 | 2.0 | 0.11 |
| G | Patient Management Module | 2 | 3 | 5 | 3.2 | 0.25 |
| H | Medication Tracking Module | 2 | 3 | 4 | 3.0 | 0.11 |
| I | Appointment Scheduling Module | 2 | 3 | 4 | 3.0 | 0.11 |
| J | Reporting Module | 1 | 2 | 4 | 2.2 | 0.25 |
| K | Frontend Development | 3 | 4 | 6 | 4.2 | 0.25 |
| L | System Integration | 1 | 2 | 3 | 2.0 | 0.11 |
| M | Unit Testing | 1 | 2 | 3 | 2.0 | 0.11 |
| N | System Testing | 1 | 2 | 4 | 2.2 | 0.25 |
| O | User Acceptance Testing | 1 | 1 | 2 | 1.2 | 0.03 |
| P | Documentation | 1 | 2 | 3 | 2.0 | 0.11 |
| Q | Deployment | 0.5 | 1 | 1.5 | 1.0 | 0.03 |

**Formula Used:** te = (a + 4m + b) / 6  
**Variance Formula:** σ² = ((b - a) / 6)²

### 3. Activity Dependencies

| Activity | Predecessors | Successors |
|----------|-------------|------------|
| A | - | B, C |
| B | A | D, E |
| C | A | E, F |
| D | B | K |
| E | B, C | F, G, H, I, J |
| F | C, E | L |
| G | E | L |
| H | E | L |
| I | E | L |
| J | E | L |
| K | D | L |
| L | F, G, H, I, J, K | M |
| M | L | N |
| N | M | O |
| O | N | P |
| P | O | Q |
| Q | P | - |

### 4. PERT Chart Network Diagram

```
Start → A(2.0) → B(3.2) → D(3.0) → K(4.2) → L(2.0) → M(2.0) → N(2.2) → O(1.2) → P(2.0) → Q(1.0) → End
        ↓        ↓        ↓        ↑       ↑
        C(2.2) → E(1.2) → F(2.0) ──┘       │
                 ↓        G(3.2) ──────────┘
                 ↓        H(3.0) ──────────┘
                 ↓        I(3.0) ──────────┘
                 ↓        J(2.2) ──────────┘
```

### 5. Critical Path Analysis

#### Critical Path: A → B → D → K → L → M → N → O → P → Q
**Critical Path Duration:** 2.0 + 3.2 + 3.0 + 4.2 + 2.0 + 2.0 + 2.2 + 1.2 + 2.0 + 1.0 = **22.8 weeks**

#### Alternative Paths:
1. **Path 2:** A → C → E → F → L → M → N → O → P → Q = 20.8 weeks
2. **Path 3:** A → C → E → G → L → M → N → O → P → Q = 21.8 weeks
3. **Path 4:** A → C → E → H → L → M → N → O → P → Q = 21.0 weeks
4. **Path 5:** A → C → E → I → L → M → N → O → P → Q = 21.0 weeks
5. **Path 6:** A → C → E → J → L → M → N → O → P → Q = 20.4 weeks

### 6. Early Start (ES) and Late Start (LS) Times

| Activity | ES | EF | LS | LF | Slack |
|----------|----|----|----|----|-------|
| A | 0 | 2.0 | 0 | 2.0 | 0* |
| B | 2.0 | 5.2 | 2.0 | 5.2 | 0* |
| C | 2.0 | 4.2 | 3.0 | 5.2 | 1.0 |
| D | 5.2 | 8.2 | 5.2 | 8.2 | 0* |
| E | 5.2 | 6.4 | 6.2 | 7.4 | 1.0 |
| F | 6.4 | 8.4 | 14.6 | 16.6 | 8.2 |
| G | 6.4 | 9.6 | 13.6 | 16.6 | 7.2 |
| H | 6.4 | 9.4 | 13.6 | 16.6 | 7.2 |
| I | 6.4 | 9.4 | 13.6 | 16.6 | 7.2 |
| J | 6.4 | 8.6 | 14.4 | 16.6 | 8.0 |
| K | 8.2 | 12.4 | 8.2 | 12.4 | 0* |
| L | 12.4 | 14.4 | 16.6 | 18.6 | 4.2 |
| M | 18.6 | 20.6 | 18.6 | 20.6 | 0* |
| N | 20.6 | 22.8 | 20.6 | 22.8 | 0* |
| O | 22.8 | 24.0 | 22.8 | 24.0 | 0* |
| P | 24.0 | 26.0 | 24.0 | 26.0 | 0* |
| Q | 26.0 | 27.0 | 26.0 | 27.0 | 0* |

*Activities marked with * are on the critical path (Slack = 0)

### 7. Project Statistics

- **Expected Project Duration:** 22.8 weeks
- **Critical Path Variance:** σ² = 0.11 + 0.25 + 0.11 + 0.25 + 0.11 + 0.11 + 0.25 + 0.03 + 0.11 + 0.03 = 1.36
- **Standard Deviation:** σ = √1.36 = 1.17 weeks
- **99% Confidence Interval:** 22.8 ± (2.58 × 1.17) = 22.8 ± 3.02 weeks
- **Project Duration Range:** 19.78 to 25.82 weeks

### 8. Risk Analysis

#### High-Risk Activities (High Variance):
1. **System Analysis & Design (B)** - σ² = 0.25
2. **Database Design (C)** - σ² = 0.25
3. **Patient Management Module (G)** - σ² = 0.25
4. **Reporting Module (J)** - σ² = 0.25
5. **Frontend Development (K)** - σ² = 0.25
6. **System Testing (N)** - σ² = 0.25

#### Recommendations:
- Allocate additional resources to critical path activities
- Monitor high-variance activities closely
- Maintain buffer time for critical activities
- Consider parallel development where possible

### 9. Milestone Schedule

| Milestone | Week | Activities Completed |
|-----------|------|---------------------|
| Project Kickoff | 0 | Project initiation |
| Requirements Complete | 2 | A |
| Design Phase Complete | 8.2 | A, B, C, D |
| Development Setup Complete | 6.4 | E |
| Core Modules Complete | 16.6 | F, G, H, I, J |
| Frontend Complete | 12.4 | K |
| Integration Complete | 18.6 | L |
| Testing Complete | 24.0 | M, N, O |
| Project Complete | 27.0 | P, Q |

This PERT chart provides a comprehensive view of the MediTrack project timeline, critical path, and risk factors for effective project management and scheduling.
