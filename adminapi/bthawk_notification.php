<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate = date("Y-m-d");
	$r_date=strtotime($cdate);
	$r2_date= strtotime("-60 day", $r_date);
	$d2_date=trim(date('Y-m-d', $r2_date));
	$select_product=mysqli_query($con,"SELECT * FROM tbl_bt_activity where insert_date>='$d2_date' and type='App' order by insert_date desc");
	if(mysqli_num_rows($select_product)>0)
	{     
        $product=array();
        while($fetch_product1=mysqli_fetch_array($select_product))
		{
			$product['message_id']=$fetch_product1['activity_id'];
			$product['title']=$fetch_product1['activity_title'];
			$product['message']=$fetch_product1['activity_message'];
			$product['create_date']=$fetch_product1['insert_date'];
			$response['product'][]=$product;
        } 
		$response['success']='1';
        $response['message']="Notification Detail Successfully Fetch";
	}
	else
	{
	    $response['success']='0';
		$response['details']="No Notification Available";	
	}		
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>