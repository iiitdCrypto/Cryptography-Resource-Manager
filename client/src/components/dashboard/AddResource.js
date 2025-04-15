import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { FaUpload, FaTimes, FaBook, FaVideo, FaFile, FaFilePdf, FaFilePowerpoint } from 'react-icons/fa';
import axios from 'axios';

const AddResource = ({ onClose, onResourceAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    content: '',
    url: '',
    author: '',
    tags: [],
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(currentTag.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, currentTag.trim()]
        }));
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let fileUrl = formData.url;

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append('file', selectedFile);

        // Upload file first
        const uploadResponse = await axios.post('http://localhost:5001/api/upload', fileData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        fileUrl = uploadResponse.data.url;
      }

      // Create resource with file URL
      const resourceData = {
        ...formData,
        url: fileUrl
      };

      const response = await axios.post('http://localhost:5001/api/resources', resourceData);
      onResourceAdded(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <FaVideo />;
      case 'book': return <FaBook />;
      case 'pdf': return <FaFilePdf />;
      case 'ppt': return <FaFilePowerpoint />;
      default: return <FaFile />;
    }
  };

  return (
    <Modal>
      <ModalContent>
        <ModalHeader>
          <h2>Add New Resource</h2>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Resource Title *</Label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter resource title"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Description *</Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter resource description"
              required
              rows={4}
            />
          </FormGroup>

          <FormGroup>
            <Label>Resource Type *</Label>
            <Select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="video">Video</option>
              <option value="book">Book</option>
              <option value="pdf">PDF</option>
              <option value="ppt">PowerPoint</option>
              <option value="note">Note</option>
              <option value="article">Article</option>
            </Select>
          </FormGroup>

          {formData.type === 'note' || formData.type === 'article' ? (
            <FormGroup>
              <Label>Content</Label>
              <Textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Enter resource content"
                rows={6}
              />
            </FormGroup>
          ) : (
            <FormGroup>
              <Label>Resource File</Label>
              <FileUploadContainer>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept={
                    formData.type === 'video' ? 'video/*' :
                    formData.type === 'pdf' ? '.pdf' :
                    formData.type === 'ppt' ? '.ppt,.pptx' :
                    formData.type === 'book' ? '.pdf,.epub,.mobi' :
                    '*'
                  }
                />
                <UploadButton type="button" onClick={() => fileInputRef.current.click()}>
                  <FaUpload />
                  <span>Upload {formData.type.toUpperCase()}</span>
                </UploadButton>
                {!selectedFile && (
                  <Input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="Or enter resource URL"
                  />
                )}
              </FileUploadContainer>
              {selectedFile && (
                <SelectedFile>
                  <FileIcon>{getTypeIcon(formData.type)}</FileIcon>
                  <FileName>{selectedFile.name}</FileName>
                  <RemoveFileButton onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}>
                    <FaTimes />
                  </RemoveFileButton>
                </SelectedFile>
              )}
            </FormGroup>
          )}

          <FormGroup>
            <Label>Author</Label>
            <Input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="Enter author name"
            />
          </FormGroup>

          <FormGroup>
            <Label>Tags</Label>
            <TagInput
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Type tag and press Enter"
            />
            {formData.tags.length > 0 && (
              <TagsContainer>
                {formData.tags.map((tag, index) => (
                  <Tag key={index}>
                    {tag}
                    <RemoveTagButton onClick={() => removeTag(tag)}>
                      <FaTimes />
                    </RemoveTagButton>
                  </Tag>
                ))}
              </TagsContainer>
            )}
          </FormGroup>

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Resource'}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </Modal>
  );
};

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textLight};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FileUploadContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const SelectedFile = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => `${theme.colors.primary}10`};
  border-radius: 4px;
`;

const FileIcon = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;

const FileName = styled.span`
  flex: 1;
  color: ${({ theme }) => theme.colors.text};
`;

const RemoveFileButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.error};
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: ${({ theme }) => theme.colors.errorDark};
  }
`;

const TagInput = styled(Input)`
  margin-bottom: 0.5rem;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background-color: ${({ theme }) => `${theme.colors.primary}10`};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  font-size: 0.9rem;
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  
  &:hover {
    color: ${({ theme }) => theme.colors.error};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
`;

const SubmitButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray};
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundAlt};
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.error}20;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

export default AddResource;