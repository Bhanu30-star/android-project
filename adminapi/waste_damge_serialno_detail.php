<?php
$response = array();
include("../../connect.php");
if(isset($_POST['distributor_id']) && isset($_POST['total_order']))
{   	
	$toder = $_POST['total_order'];
	$dis_id = $_POST['distributor_id'];
	$remark=$_POST['remark'];
	$uniqueId=uniqid();
	$uniqueId1="DM".strtoupper($uniqueId);
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$prodid=$person_a['pid'];
		$prodname=$person_a['pname'];
		$ordquantiy=$person_a['quantity'];
		$proprice=$person_a['pro_price'];
		$temp_explode = isset($person_a['pro_imei_no']) ? $person_a['pro_imei_no'] : '';
		$query2=mysqli_query($con,"INSERT INTO `tbl_distributor_damage_stock_master`(`distributor_id`, `transaction_date`, `transaction_time`, `product_id`, `quantity`, `bag_type`, `bag_qty`, `product_price`, `unique_bill`, `serial_no`, `status`, `remark`, `insert_date`) VALUES ('$dis_id','$da','$scro','$prodid','$ordquantiy','','','$proprice','$uniqueId1','Yes','Complete','$remark','$scri')");
		$re = mysqli_insert_id($con);
		$temp_explode1=explode(",",$temp_explode);
		for($jk=0;$jk<sizeof($temp_explode1);$jk++)
		{
			$p_imei_no=trim($temp_explode1[$jk]);
			$data_select = mysqli_query($con,"select IMEI from tbl_product_serialno where product_id='$prodid' and IMEI='$p_imei_no' AND status='Available' and user_id='0'");
			if(mysqli_num_rows($data_select)>0)
			{
				 $query2=mysqli_query($con,"INSERT INTO `tbl_distributor_damage_stock_detail`(`transaction_id`, `product_id`, `imei_no`, `unique_bill`, `status`) VALUES ('$re','$prodid','$p_imei_no','$uniqueId1','Complete')");
				 $uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Damage',saleout_date='$da',saleout_time='$scro' where IMEI ='$p_imei_no' and product_id='$prodid'");  
			}
		}
					
		$query_stock="SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
		$res_stock = mysqli_query($con,$query_stock);
		$row_stock =  mysqli_fetch_assoc($res_stock);
		if(mysqli_num_rows($res_stock)>0)
		{
			$stock_quantity=$row_stock['closing_stock'];
			$temp_quantity=$stock_quantity-$ordquantiy;
			$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity' where date ='$da' and distributor_id='$dis_id' and product_id='$prodid'");	
			$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity' where distributor_id='$dis_id' and product_id='$prodid'");	
		}
		else
		{
			$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
			$res_stock1 = mysqli_query($con,$query_stock1);
			$row_stock1 =  mysqli_fetch_assoc($res_stock1);
			if(mysqli_num_rows($res_stock1)>0)
			{
				$stock_quantity=$row_stock1['closing_stock'];
				$temp_quantity=$stock_quantity-$ordquantiy;
				$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,closing_stock,opening_stock,date)values('$dis_id','$prodid','$temp_quantity','$stock_quantity','$da')");
				$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity' where distributor_id='$dis_id' and product_id='$prodid'");
			}
		}
	}  
	$response['success']=1;
	$response['details']="Damage/Garbage Txn Successfully Generated";
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 