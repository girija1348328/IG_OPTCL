import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Img,
  Input,
  Container,
  Grid,
  Text,
  GridItem,
  HStack,
  VStack,
  SimpleGrid,
  IconButton,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import IGlogo_2 from "../../src/assets/IGlogo_2.png";
import uploadIcon from '../../src/assets/mdi_cloud_upload_outline.png'
import uim_process from '../../src/assets/uim_process.png';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Progress } from '@chakra-ui/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const UploadImage = () => {
    const [images, setImages] = useState([]);
    const [folderName, setFolderName] = useState('');
    const [showUploadBox, setShowUploadBox] = useState(true);
    const fileInputRef = useRef(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [processedImageCount, setProcessedImageCount] = useState(0);
    const [buttonText, setButtonText] = useState("Process Data");
  
    const handleButtonClick = () => {
      if (buttonText === "Process Data") {
        processSubmitDataModel();
      } else if (buttonText === "Generate Data") {
        generatePDF();
      }
    }
  
    const generatePDF = () => {
      const ids = ['bodySectionBS01', 'bodySectionBS02'];
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
    
      const captureNext = (index = 0, accumulatedHeight = 0) => {
        if (index >= ids.length) {
          doc.save('combined-document.pdf');
          toast.success('PDF generated and downloaded!');
          return;
        }
    
        const element = document.getElementById(ids[index]);
        if (element) {
          html2canvas(element, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210;
            const imgHeight = canvas.height * imgWidth / canvas.width;
    
            if (index > 0) {
              doc.addPage();
            }
            doc.addImage(imgData, 'PNG', 0, accumulatedHeight, imgWidth, imgHeight);
            captureNext(index + 1, accumulatedHeight + imgHeight);
          }).catch(err => {
            console.error('Error capturing section:', ids[index], err);
            toast.error(`Failed to capture section: ${ids[index]}`);
          });
        }
      };
    
      captureNext();
    };
  
    const handleImageChange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        const path = files[0].webkitRelativePath || '';
        const folder = path.substring(0, path.lastIndexOf('/'));
        setFolderName(folder.split('/').pop());
      }
  
      const newImages = files.map((file) => ({
        id: file.name,
        url: URL.createObjectURL(file),
      }));
      setImages((prevImages) => [...prevImages, ...newImages]);
      setShowUploadBox(false);
    };
  
    const handleDeleteImage = (id) => {
      const newImages = images.filter((image) => image.id !== id);
      setImages(newImages);
      if (newImages.length === 0) {
        setShowUploadBox(true);
        setFolderName('');
      }
    };
  
    const handleAddNewFolderClick = () => {
      fileInputRef.current.click();
    };
  
    const processSubmitDataModel = async () => {
      const formData = new FormData();
  
      try {
        // Convert all blob URLs to blob objects and append them to FormData
        const blobPromises = images.map(async (image) => {
          const response = await fetch(image.url);
          const blob = await response.blob();
          formData.append('images', blob, image.id); // Use the original filename as the third argument
        });
  
        // Wait for all blob conversions to complete
        await Promise.all(blobPromises);
  
        // Now send the form data with the actual file objects
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:5000/upload", true);
  
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
            setUploadComplete(false);
          }
        };
  
        xhr.onload = () => {
          if (xhr.status === 200) {
            setUploadComplete(true);
            setProcessedImageCount(images.length);
            setUploadProgress(0);
            setButtonText("Generate Data");
            toast.success('All data processed successfully!');
          } else {
            toast.error('Upload failed: ' + xhr.statusText);
          }
        };
  
        xhr.onerror = () => {
          toast.error('Upload error: ' + xhr.statusText);
        };
  
        xhr.send(formData);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error processing data: ' + error.message);
      }
    };
    return (
      <Container maxW="container.xxl" bg="#E4E5E7" p={0}>
        <Grid
          templateAreas={{
            base: `"header header"
                   "section1 section2"
                   "footer footer"`,
            md: `"header section2"
                 "section1 section2"
                 "footer section2"`
          }}
          gridTemplateColumns={{
            base: "1fr",
            md: "3fr 1fr"
          }}

          gridTemplateRows={{
            base: "auto minmax(20%, 1fr) minmax(80%, 3fr) auto",
            md: "auto 1fr auto"
          }}
          gap={4}
          minHeight={{ base: "auto", md: "100vh" }}
          color="blackAlpha.700"
          fontWeight="bold"
        >
          <GridItem id='headerSectionHS' area={'header'} p={4}>
            <HStack>
              <Img src={IGlogo_2} height={{ md: "35" }}></Img>
              <Text color="#000" fontSize="24px" fontStyle="normal" fontWeight="500">Preview</Text>
            </HStack>
          </GridItem>
  
          {showUploadBox && (
            <GridItem area={'section1'} p={4} display="flex" justifyContent="center" alignItems="center">
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                width="636px"
                height="257px"
                borderRadius="5px"
                background="rgba(255, 255, 255, 0.60)"
                boxShadow="0px 4px 4px 0px rgba(0, 0, 0, 0.25)"
              >
                <VStack spacing="4">
                  <Img src={uploadIcon} height={30}></Img>
                  <Text color="#292D32" fontSize="20.73px" fontStyle="normal" fontWeight="500" lineHeight="normal">
                    Choose a folder or drag & drop it here
                  </Text>
                  <Box>
                    <Input
                      id="folderInput"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      webkitdirectory="true"
                      directory="true"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                    />
                    <Button as="label" htmlFor="folderInput" variant="outline" size="md">
                      Browse Folder
                    </Button>
                  </Box>
                </VStack>
              </Box>
            </GridItem>
          )}
  
          <GridItem
            area={'section2'}
            id= "bodySectionBS02"
            p={4}
            background="rgba(255, 255, 255, 0.55)"
            color="#8087A2"
            fontSize="20px"
            fontStyle="normal"
            fontWeight="500"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            height="100%"
          >
            <Text>Defects</Text>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              flex="1"
            >
              <Text>{folderName || "No Defects Selected"}</Text>
            </Box>
  
            <Box
              display="flex"
              justifyContent="center"
              width="100%"
            >
              <Button
                borderRadius="5px"
                background="#DCDFEA"
                onClick={handleButtonClick}
              >
                <Img src={uim_process} height="28.2px" width="8.5" marginRight="10px"></Img>
                <Text color="#374374">
                  {buttonText}
                </Text>
              </Button>
            </Box>
          </GridItem>
  
          {images.length > 0 && (
            <GridItem area={'section1'} id= "bodySectionBS01" p={4} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
              <Text mb={4}>Images</Text>
              <Box display="flex" justifyContent="flex-start" overflowY="auto" maxHeight="calc(100px * 3 + 16px * 2)" width={{ base: "90%", md: "80%", lg: "70%" }}>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} width="full">
                  {images.map((image) => (
                    <Box key={image.id} position="relative">
                      <Img src={image.url} boxSize="100px" objectFit="cover" borderRadius="md" />
                      <IconButton
                        aria-label={`Delete ${image.id}`}
                        icon={<CloseIcon />}
                        size="sm"
                        position="absolute"
                        top="1"
                        right="1"
                        colorScheme="red"
                        onClick={() => handleDeleteImage(image.id)}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </GridItem>
          )}
  
          <GridItem
            area={'footer'}
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            flexDirection="row"
            p={4}
            m={0}
            width="100%"
            height="100%"
          >
            <Button
              onClick={handleAddNewFolderClick}
              mr={3}
              width="200px"
              borderRadius="5px"
              background="#636ABA"
            >
              <Text color="rgba(255, 255, 255, 0.90);">
                + Add New Folder
              </Text>
            </Button>
            {uploadComplete ? (
              <Text ml={3} minWidth="50px" textAlign="center">
                {processedImageCount} images processed
              </Text>
            ) : (
              <>
                <Progress
                  flex="1"
                  value={uploadProgress}
                  size="sm"
                  colorScheme="green"
                  borderRadius="5px"
                />
                <Text ml={3} minWidth="50px" textAlign="center">
                  {uploadProgress.toFixed(0)}%
                </Text>
              </>
            )}
          </GridItem>
        </Grid>
        <ToastContainer />
      </Container>
    );
  }

export default UploadImage;