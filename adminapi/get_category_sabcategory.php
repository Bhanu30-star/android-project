<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$dis_id = $_POST['distributor_id'];
	$select_category = mysqli_query($con,"SELECT * FROM `tbl_product_category_master` where status='Active' and distributor_id='$dis_id' order by category_name");
	$category_Detail=array();
	if(mysqli_num_rows($select_category)>0)
	{     
		while($fetch_category=mysqli_fetch_assoc($select_category))
		{
			$category_Detail['category_id']=$fetch_category['category_id'];
			$category_Detail['category_name']=$fetch_category['category_name'];
			$category_Detail['sabcategory_detail']=array();
			$select_subcategory = mysqli_query($con,"SELECT * FROM tbl_product_subcategory_master where category_id = '".$fetch_category['category_id']."' and status='Active' order by subcategory_name");
			if(mysqli_num_rows($select_subcategory)>0)
			{     
				while($fetch_subcategory=mysqli_fetch_assoc($select_subcategory))
				{
		        	$sabcategory_detail['subcategory_id']=$fetch_subcategory['subcategory_id'];
					$sabcategory_detail['subcategory_name']=$fetch_subcategory['subcategory_name'];			
					$category_Detail['sabcategory_detail'][]=$sabcategory_detail;
				}
			}
			$response['category_Detail'][]=$category_Detail;
		}
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['message']="No Data Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required Field Missing";
}	
echo json_encode($response);
?>