<?php
include("../../connect.php");
$response = array();
if(isset($_POST['eway_sub_supply_value']))
{	
	$eway_supply_id=$_POST['eway_sub_supply_value'];
	$query_eway = mysqli_query($con,"SELECT * FROM `tbl_eway_document_type` WHERE eway_sub_supply_id='$eway_supply_id'");
	$eway_doc_detail=array();
	if(mysqli_num_rows($query_eway)>0)
	{     
		while($row=mysqli_fetch_assoc($query_eway))
		{
			$eway_doc_detail['eway_doc_value']=$row['eway_doc_value'];
			$eway_doc_detail['eway_doc_name']=$row['eway_doc_name'];
			$response['eway_doc_detail'][]=$eway_doc_detail;
		}
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>