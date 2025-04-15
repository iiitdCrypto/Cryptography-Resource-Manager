import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const CryptoIIITD = () => {
  const [professors, setProfessors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        const response = await axios.get('/api/professors');
        setProfessors(response.data);
      } catch (error) {
        console.error('Error fetching professors:', error);
      }
    };

    fetchProfessors();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  const handleProjectSelect = (event) => {
    const project = projects.find(p => p.id === event.target.value);
    setSelectedProject(project);
  };

  const getProjectStatus = (startDate, endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    return now > end ? 'Completed' : 'Ongoing';
  };

  return (
    <PageContainer>
      <Header>
        <h1>Crypto@IIITD</h1>
        <p>Center of Excellence in Cryptography Research and Development</p>
      </Header>

      <ContentSection>
        <SectionTitle>About Our Program</SectionTitle>
        <Description>
          The Cryptography Research Program at IIIT-Delhi is dedicated to advancing the field of cryptography
          through cutting-edge research, education, and industry collaboration. Our focus areas include:
        </Description>

        <FocusAreas>
          <FocusArea>
            <h3>Research Areas</h3>
            <ul>
              <li>Post-Quantum Cryptography</li>
              <li>Blockchain Technology</li>
              <li>Zero-Knowledge Proofs</li>
              <li>Homomorphic Encryption</li>
              <li>Cryptanalysis</li>
            </ul>
          </FocusArea>

          <FocusArea>
            <h3>Education</h3>
            <ul>
              <li>Advanced Cryptography Courses</li>
              <li>Research Opportunities</li>
              <li>Industry Partnerships</li>
              <li>Workshops and Seminars</li>
              <li>International Collaborations</li>
            </ul>
          </FocusArea>

          <FocusArea>
            <h3>Innovation</h3>
            <ul>
              <li>Security Solutions</li>
              <li>Privacy Technologies</li>
              <li>Protocol Development</li>
              <li>Applied Cryptography</li>
              <li>Industry Projects</li>
            </ul>
          </FocusArea>
        </FocusAreas>
      </ContentSection>

      <ContentSection>
        <SectionTitle>Our Vision</SectionTitle>
        <Description>
          To be a world-leading center for cryptographic research and education, fostering innovation
          and developing secure solutions for the digital world. We aim to bridge the gap between
          theoretical research and practical applications in cryptography.
        </Description>
      </ContentSection>

      <ContentSection>
        <SectionTitle>Professors</SectionTitle>
        <ProfessorList>
          {professors.map((professor) => (
            <ProfessorItem key={professor.id}>
              <ProfessorImage 
                src={professor.image_url || '/default-professor.png'} 
                alt={professor.name}
              />
              <ProfessorName>{professor.name}</ProfessorName>
              <ProfessorDesignation>{professor.title}</ProfessorDesignation>
              <p>{professor.specialization}</p>
              <ProfessorContact>
                <a href={`mailto:${professor.email}`}>Email: {professor.email}</a>
                {professor.website_url && (
                  <a href={professor.website_url} target="_blank" rel="noopener noreferrer">
                    Website
                  </a>
                )}
              </ProfessorContact>
            </ProfessorItem>
          ))}
        </ProfessorList>
      </ContentSection>

      <ContentSection>
        <SectionTitle>Projects</SectionTitle>
        <ProjectSelector>
          <SelectWrapper>
            <select onChange={handleProjectSelect} defaultValue="">
              <option value="" disabled>Select a Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </SelectWrapper>

          {selectedProject && (
            <ProjectDetails>
              <ProjectHeader>
                <ProjectTitle>{selectedProject.title}</ProjectTitle>
                <ProjectType>{selectedProject.type}</ProjectType>
              </ProjectHeader>

              <ProjectTimeframe>
                {new Date(selectedProject.startDate).toLocaleDateString()} - {new Date(selectedProject.endDate).toLocaleDateString()}
                <ProjectStatus>
                  ({getProjectStatus(selectedProject.startDate, selectedProject.endDate)})
                </ProjectStatus>
              </ProjectTimeframe>

              <ProjectDescription>{selectedProject.description}</ProjectDescription>

              <ProjectTeam>
                <TeamSection>
                  <TeamTitle>Project Members:</TeamTitle>
                  <MembersList>
                    {selectedProject.members.map((member, index) => (
                      <MemberItem key={index}>{member}</MemberItem>
                    ))}
                  </MembersList>
                </TeamSection>

                <TeamSection>
                  <TeamTitle>Project Guide:</TeamTitle>
                  <MemberItem>{selectedProject.professor}</MemberItem>
                </TeamSection>
              </ProjectTeam>

              {selectedProject.technologies && (
                <TechStack>
                  <TeamTitle>Technologies:</TeamTitle>
                  <TechList>
                    {selectedProject.technologies.map((tech, index) => (
                      <TechItem key={index}>{tech}</TechItem>
                    ))}
                  </TechList>
                </TechStack>
              )}
            </ProjectDetails>
          )}
        </ProjectSelector>
      </ContentSection>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.medium};

  h1 {
    font-size: 2.5rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.2rem;
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const ContentSection = styled.section`
  margin-bottom: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.small};
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1.5rem;
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const FocusAreas = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const FocusArea = styled.div`
  background: ${({ theme }) => theme.colors.backgroundLight};
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.small};

  h3 {
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
    font-size: 1.3rem;
  }

  ul {
    list-style-type: none;
    padding: 0;

    li {
      margin-bottom: 0.8rem;
      color: ${({ theme }) => theme.colors.text};
      font-size: 1rem;
      
      &:before {
        content: "•";
        color: ${({ theme }) => theme.colors.primary};
        font-weight: bold;
        display: inline-block;
        width: 1em;
        margin-left: -1em;
      }
    }
  }
`;

const ProfessorList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
`;

const ProfessorItem = styled.div`
  background: ${({ theme }) => theme.colors.backgroundLight};
  padding: 2rem;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const ProfessorImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  object-fit: cover;
  margin-bottom: 1rem;
  border: 3px solid ${({ theme }) => theme.colors.primary};
`;

const ProfessorName = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.4rem;
  margin-bottom: 1rem;
`;

const ProfessorDesignation = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
`;

const ProfessorContact = styled.div`
  margin-top: 1rem;
  
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    display: block;
    margin-bottom: 0.5rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ProjectSelector = styled.div`
  margin-top: 2rem;
`;

const SelectWrapper = styled.div`
  margin-bottom: 2rem;
  
  select {
    width: 100%;
    padding: 0.8rem;
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 1rem;
    background: white;
    color: ${({ theme }) => theme.colors.text};
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const ProjectDetails = styled.div`
  background: ${({ theme }) => theme.colors.backgroundLight};
  padding: 2rem;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.small};
`;

const ProjectHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ProjectTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.4rem;
  margin-bottom: 1rem;
  flex: 1;
`;

const ProjectType = styled.span`
  background: ${({ theme }) => theme.colors.secondary};
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.9rem;
`;

const ProjectTimeframe = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1rem;
  margin-bottom: 1.5rem;
`;

const ProjectStatus = styled.span`
  margin-left: 0.5rem;
  font-weight: 500;
`;

const ProjectDescription = styled.p`
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
`;

const ProjectTeam = styled.div`
  margin: 2rem 0;
`;

const TeamSection = styled.div`
  margin-bottom: 1.5rem;
`;

const TeamTitle = styled.h4`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.8rem;
  font-size: 1.1rem;
`;

const MembersList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const MemberItem = styled.span`
  background: ${({ theme }) => theme.colors.backgroundLight};
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const TechStack = styled.div`
  h4 {
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 0.8rem;
  }
`;

const TechList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const TechItem = styled.span`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

export default CryptoIIITD;