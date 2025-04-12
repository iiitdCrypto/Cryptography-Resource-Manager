import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { 
  FiPlus, 
  FiFolder, 
  FiCalendar, 
  FiClock, 
  FiCheck, 
  FiUsers 
} from 'react-icons/fi';

const Analytics = () => {
  const [faculty, setFaculty] = useState([]);
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [newFaculty, setNewFaculty] = useState({ name: '', department: '' });
  const [newProject, setNewProject] = useState({
    type: 'IP',
    title: '',
    startDate: '',
    status: 'ongoing',
    members: '',
    facultyId: null
  });

  const projectTypes = ['IP', 'IS', 'Capstone', 'BTP', 'Thesis'];

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchFacultyData = async () => {
    try {
      const response = await axios.get('/api/faculty');
      setFaculty(response.data);
    } catch (err) {
      console.error('Error fetching faculty data:', err);
    }
  };

  const handleAddFaculty = async () => {
    try {
      await axios.post('/api/faculty', newFaculty);
      setShowAddFaculty(false);
      setNewFaculty({ name: '', department: '' });
      fetchFacultyData();
    } catch (err) {
      console.error('Error adding faculty:', err);
    }
  };

  const handleAddProject = async () => {
    try {
      await axios.post('/api/projects', {
        ...newProject,
        facultyId: selectedFaculty.id
      });
      setShowAddProject(false);
      setNewProject({
        type: 'IP',
        title: '',
        startDate: '',
        status: 'ongoing',
        members: '',
        facultyId: null
      });
      fetchFacultyData();
    } catch (err) {
      console.error('Error adding project:', err);
    }
  };

  return (
    <Container>
      <Header>
        <PageTitle>Projects Dashboard</PageTitle>
        <AddButton onClick={() => setShowAddFaculty(true)}>
          <FiPlus /> Add Faculty
        </AddButton>
      </Header>

      {showAddFaculty && (
        <Modal>
          <ModalContent>
            <h2>Add New Faculty</h2>
            <Input
              placeholder="Professor Name"
              value={newFaculty.name}
              onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
            />
            <Input
              placeholder="Department"
              value={newFaculty.department}
              onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
            />
            <ButtonGroup>
              <Button onClick={handleAddFaculty}>Add</Button>
              <Button secondary onClick={() => setShowAddFaculty(false)}>Cancel</Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {showAddProject && (
        <Modal>
          <ModalContent>
            <h2>Add New Project</h2>
            <Select
              value={newProject.type}
              onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
            >
              {projectTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
            <Input
              placeholder="Project Title"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            />
            <Input
              type="date"
              value={newProject.startDate}
              onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
            />
            <Select
              value={newProject.status}
              onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
            >
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </Select>
            <Input
              placeholder="Team Members (comma separated)"
              value={newProject.members}
              onChange={(e) => setNewProject({ ...newProject, members: e.target.value })}
            />
            <ButtonGroup>
              <Button onClick={handleAddProject}>Add</Button>
              <Button secondary onClick={() => setShowAddProject(false)}>Cancel</Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      <FacultyGrid>
        {faculty.map((prof) => (
          <FacultyCard key={prof.id}>
            <FacultyHeader>
              <FacultyInfo>
                <FacultyName>{prof.name}</FacultyName>
                <Department>{prof.department}</Department>
              </FacultyInfo>
              <AddButton small onClick={() => {
                setSelectedFaculty(prof);
                setShowAddProject(true);
              }}>
                <FiPlus /> Add Project
              </AddButton>
            </FacultyHeader>

            {projectTypes.map(type => (
              <ProjectSection key={type}>
                <ProjectTypeHeader>
                  <FiFolder /> {type} Projects
                </ProjectTypeHeader>
                {prof.projects?.filter(p => p.type === type).map(project => (
                  <ProjectCard key={project.id} status={project.status}>
                    <ProjectTitle>{project.title}</ProjectTitle>
                    <ProjectInfo>
                      <InfoItem>
                        <FiCalendar />
                        {new Date(project.startDate).toLocaleDateString()}
                      </InfoItem>
                      <InfoItem>
                        {project.status === 'ongoing' ? <FiClock /> : <FiCheck />}
                        {project.status}
                      </InfoItem>
                    </ProjectInfo>
                    <Members>
                      <FiUsers />
                      {project.members}
                    </Members>
                  </ProjectCard>
                ))}
              </ProjectSection>
            ))}
          </FacultyCard>
        ))}
      </FacultyGrid>
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  color: #333;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;

  h2 {
    margin-bottom: 1.5rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background: ${props => props.secondary ? '#e0e0e0' : '#3f51b5'};
  color: ${props => props.secondary ? '#333' : 'white'};
  cursor: pointer;
`;

const AddButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: ${props => props.small ? '0.5rem 1rem' : '0.75rem 1.5rem'};
  font-size: ${props => props.small ? '0.875rem' : '1rem'};
`;

const FacultyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
`;

const FacultyCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const FacultyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
`;

const FacultyInfo = styled.div``;

const FacultyName = styled.h2`
  font-size: 1.25rem;
  margin: 0;
`;

const Department = styled.p`
  color: #666;
  margin: 0.25rem 0 0;
`;

const ProjectSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ProjectTypeHeader = styled.h3`
  font-size: 1rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ProjectCard = styled.div`
  background: ${props => props.status === 'completed' ? '#f8f9fa' : 'white'};
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 0.5rem;
`;

const ProjectTitle = styled.h4`
  font-size: 1rem;
  margin: 0 0 0.5rem;
`;

const ProjectInfo = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const InfoItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #666;
  font-size: 0.875rem;
`;

const Members = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.875rem;
`;

export default Analytics;

