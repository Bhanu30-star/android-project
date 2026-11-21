<?php
include ('../../connect.php');
//include("distributor-session-check.php");
mysqli_set_charset($con, 'utf8');
header( 'Content-Type: text/html; charset=utf-8' );
$hindi_result = mysqli_query($con,"SET NAMES utf8");
$ver = (int)$_GET['uid'];
$start_date = $_GET['sdate'];
$end_date = $_GET['edate'];
$bulkbilltype =$_GET['billtype'];
$lng=$_GET['lng'];
if($bulkbilltype=="Invoice")
	$billtype="Tax Invoice";
else if($bulkbilltype=="Challan")
		$billtype="Delivery Challan";
else if($bulkbilltype=="Receipt")
		$billtype="Receipt";
else $billtype="Payout";
$party_place_id='';
if($_GET['searchparty']!='')
{
	$vb=1;
	$searchparty1=$_GET['searchparty'];
	$search_party=explode("-",$searchparty1);
	$party_name_val=trim($search_party[0]);
	$party_phone_val=trim($search_party[1]);
	$result_val = mysqli_query($con, "select * from tbl_party where party_phone='$party_phone_val' and party_name='$party_name_val' and status='Active'");
	while($row_party = mysqli_fetch_array($result_val)){
		if($vb==1)
			$party_place_id=$row_party['party_id'];
		else
			$party_place_id=$party_place_id.",".$row_party['party_id'];
		$vb++;
	}
}
$res_terms = mysqli_query($con,"select * from tbl_dist_terms_conditions where distributor_id='$ver'");
if(mysqli_num_rows($res_terms)>0)
{
	$a_terms=mysqli_fetch_array($res_terms);
	$tems_condtn1=$a_terms['terms_condition1'];
	$tems_condtn2=$a_terms['terms_condition2'];
	$tems_condtn3=$a_terms['terms_condition3'];
	$tems_condtn4=$a_terms['terms_condition4'];
	$tems_condtn5=$a_terms['terms_condition5'];
	$tems_condtn6=$a_terms['terms_condition6'];
	$tems_condtn7=$a_terms['terms_condition7'];
}
else
{
	$tems_condtn1='';
	$tems_condtn2='';
	$tems_condtn3='';
	$tems_condtn4='';
	$tems_condtn5='';
	$tems_condtn6='';
	$tems_condtn7='';
}
$res_des = mysqli_query($con,"select * from tbl_distributor where distributor_id='$ver'");
$row_des  = mysqli_num_rows($res_des);
$a=mysqli_fetch_array($res_des);
if($row_des>0)
{
	if($lng=='hnd'){
		$user_name_dis=$a['distributor_name_hindi'];
		$distributor_address=$a['distributor_adrs_hindi'];
	}
	else
	{
		$user_name_dis=$a['distributor_name'];
		$distributor_address=$a['distributor_address'];
	}
	//$user_name_dis=$a['distributor_name'];
	$gstin_no_dis=$a['gstin_no'];
	$dis_image=$a['image_path'];
	$dis_operator=$a['operator'];
	$place_supply=$a['place_of_supply'];
	$dist_fabrics=$a['fabrics_receipt'];
	$dist_gst_config=$a['distributor_gst_configure'];
	//$distributor_address=$a['distributor_address'];
	$distributor_email=$a['distributor_email'];
	$business_description=$a['business_description'];
	$distributor_phone=$a['phone_no'];
	$distributor_mobile=$a['mobile_no'];
	if($dis_image!='')
	{
		$temp_arr=explode(".",$dis_image);
		if($temp_arr[1]=="")
			$dis_image="";
	}
	$destination="distributor_logo/".$dis_image;
	$currency_destination="makefont/national_currency.jpg";
	$dis_bank_name=$a['bank_name'];
	$dis_account_no=$a['account_no'];
	$dis_account_name=$a['branch'];
	$dis_ifsc_no=$a['ifsc_no'];
	$code_no=$a['code_no'];
	$pan_no=$a['pan_no'];
	$terms_of_delivery=$a['terms_of_delivery'];
	$prices=explode(" ",$terms_of_delivery);
	$term_delivery1="";
	$term_delivery2="";
	$term_delivery3="";
	$term_delivery4="";
	$term_delivery5="";
	$term_delivery6="";
	for($i=0;$i<=6;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery1=$term_delivery1." ".$prices[$i];
	}
	for($i=7;$i<=13;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery2=$term_delivery2." ".$prices[$i];
	}
	for($i=14;$i<=20;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery3=$term_delivery3." ".$prices[$i];
	}
	for($i=21;$i<27;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery4=$term_delivery4." ".$prices[$i];
	}
	for($i=28;$i<34;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery5=$term_delivery5." ".$prices[$i];
	}
	for($i=35;$i<41;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery6=$term_delivery6." ".$prices[$i];
	}
	
	
}
?>
<html>
<head>
<title>Invoice</title>
<style type="text/css">
	body{
		font-size: 12px;
	}
	@page {
		margin:8px;
	}
	#page-wrap {
		width: 700px;
		margin: 0 auto;
	}
	#page-wrap1 {
		width: 700px;
		margin: 0 auto;
	}
	.center-justified {
		text-align: justify;
		margin: 0 auto;
		width: 30em;
	}
	table.outline-table {
		border-top: 1px solid;
		border-bottom: 1px solid;
		border-spacing: 0;
	}
	tr.border-bottom td, td.border-bottom {
		border-bottom: 1px solid;
	}
	tr.border-top td, td.border-top {
		border-top: 1px solid;
	}
	tr.border-right td, td.border-right {
		border-right: 1px solid;
	}
	tr.border-right td:last-child {
		border-right: 0px;
	}
	tr.center td, td.center {
		text-align: center;
		vertical-align: text-top;
	}
	td.pad-left {
		padding-left: 5px;
	}
	tr.right-center td, td.right-center {
		text-align: right;
		padding-right: 50px;
	}
	tr.right td, td.right {
		text-align: right;
	}
	.grey {
		background:grey;
	}
</style>
</head>
<body>
<?php
if($party_place_id=="")
	$res_txn_receipt = mysqli_query($con,"select transaction_id,serial_no_bill from tbl_party_transaction where transaction_date>='$start_date' and transaction_date<='$end_date' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and bill_type='$billtype' order by transaction_bill_number asc");
else
	$res_txn_receipt = mysqli_query($con,"select transaction_id,serial_no_bill from tbl_party_transaction where transaction_date>='$start_date' and transaction_date<='$end_date' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and bill_type='$billtype' and transaction_to in ($party_place_id) order by transaction_bill_number asc");

while($fetch_txn_receipt=mysqli_fetch_assoc($res_txn_receipt))
{
	$tid=$fetch_txn_receipt['transaction_id'];
	
	if($billtype=="Receipt")
	{
?>
		<div id="page-wrap" style="border: 1px solid;">
		<table width="100%">
			<tbody>
				<tr class="border-bottom">
					<?php if($dis_image==""){ ?>
					<td class="center">
						<h1 style="font-size:16px;">Receipt</h1>
						<h1><?php echo $user_name_dis; ?></h1><br>
						<?php echo $distributor_address; ?><br>
						<?php echo $distributor_email; ?> , <?php echo $distributor_phone; ?>, <?php echo $distributor_mobile; ?><br>
						<h3>GSTIN : <?php echo $gstin_no_dis; ?></h3><br>
					</td>
					<?php }else{ ?>
					<td width="10%">
						<img src="<?php echo $destination; ?>" height="100">
					</td>
					<td width="90%" class="center">
						<h1 style="font-size:16px;">Receipt</h1>
						<h1><?php echo $user_name_dis; ?></h1><br>
						<?php echo $distributor_address; ?><br>
						<?php echo $distributor_email; ?> , <?php echo $distributor_phone; ?>, <?php echo $distributor_mobile; ?><br>
						<h3>GSTIN : <?php echo $gstin_no_dis; ?></h3><br>
					</td>
					<?php } ?>
				</tr>
			</tbody>
		</table>
		<table width="100%">
			<tbody>
				<?php
					$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.transaction_id='$tid'");
					while($fetch_product=mysqli_fetch_assoc($res))
					{
						extract($fetch_product);
						$payment_mode1=$payment_mode;
						$bank_name1=$bank_name;
						$cheque_date1=$cheque_date;
						$cheque_no1=$cheque_no;
						$bill_cheque_amt=$cheque_amount;
						$final_total_amt=$final_amt;

						if($payment_mode!="Both")
						{
							$final_payment_mode=$payment_mode;
						}
						else
						{
							$final_payment_mode="Cash & Cheque";
						}
				?>
				<tr class="border-bottom">
					<td class="border-right" width="50%" style="vertical-align: top;text-align: left;font-size:15px;padding-left:1%;">
						<br><strong>Receipt No. : </strong><?php echo $transaction_bill_number; ?><br>&nbsp;
					</td>
					<td width="50%" style="vertical-align: top;text-align: left;font-size:15px;padding-left:1%;">
						<br><strong>Date : </strong><?php echo date("d-M-Y", strtotime($transaction_date)); ?><br>&nbsp;
					</td>
				</tr>
				<tr>
					<td width="50%" style="vertical-align: top;text-align: left;padding-top: 10px; padding-bottom: 10px;">
						<table>
							<tbody>
								<?php
									$res11 = mysqli_query($con,"select tbl_party_transaction_detail.product_name  from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid'");
									while($fetch_product11=mysqli_fetch_assoc($res11))
									{
										extract($fetch_product11);
										$pro_name=$product_name;
									}
								?>
								<tr>
									<td style="padding-left:1%;"><strong>Party</strong></td>
									<td>: <?php echo $party_name." ".$party_phone; ?></td>
								</tr>
								<tr>
									<td></td>
									<td > &nbsp;&nbsp;<?php echo $party_address; ?></td>
								</tr>
								<tr>
									<td style="padding-left:1%;"><strong>Payment Mode</strong></td>
									<td>: <?php echo $final_payment_mode; ?></td>
								</tr>
								<tr>
									<td style="padding-left:1%;"><strong>Paid For</strong></td>
									<td>: <?php echo $pro_name; ?></td>
								</tr>
							</tbody>
						</table>
					</td>
					<td width="50%" style="vertical-align: top;text-align: left; padding-top: 10px; padding-bottom: 10px;padding-left:1%;">
						<strong>Place of Supply : </strong><?php echo $place_of_supply." ".$party_code; ?><br><br>
						<strong>Amount ( &#8377; ) : </strong><?php echo $final_total_amt; ?><br><br>
						<strong>Narration : </strong><?php echo $bill_remark; ?>
					</td>
				</tr>
			<?php } ?>
			</tbody>
		</table>
		<table width="100%">
			<tbody>
			<?php if($payment_mode1=="Cheque") { ?>
				<tr class="border-top border-bottom">
					<td style="padding-top: 10px; padding-bottom: 10px;"><strong>Bank Name :</strong> <?php echo $bank_name1; ?></td>
					<td style="padding-top: 10px; padding-bottom: 10px;"><strong>Cheque No :</strong> <?php echo $cheque_no1; ?></td>
					<td style="padding-top: 10px; padding-bottom: 10px;"><strong>Cheque Date :</strong> <?php date("d-M-Y", strtotime($cheque_date1)); ?></td>
				</tr>
			<?php } else if($payment_mode1=="Both"){ ?>
				<tr class="border-top border-bottom">
					<td style="padding-top: 10px; padding-bottom: 10px;"><strong>Bank Name :</strong> <?php echo $bank_name1; ?></td>
					<td style="padding-top: 10px; padding-bottom: 10px;"><strong>Cheque No :</strong> <?php echo $cheque_no1; ?></td>
					<td style="padding-top: 10px; padding-bottom: 10px;"><strong>Cheque Amount :</strong> <?php echo $bill_cheque_amt; ?></td>
					<td style="padding-top: 10px; padding-bottom: 10px;"><strong>Cheque Date :</strong> <?php date("d-M-Y", strtotime($cheque_date1)); ?></td>
				</tr>
			<?php } ?>
			</tbody>
		</table>
		<table width="100%">
			<tbody>
				<tr>
					<td width="40%" style="padding-top: 20px; padding-bottom: 20px;">
						<table width="100%">
							<tbody>
								<tr class="border-bottom">
									<td style="padding-top: 10px; padding-bottom: 10px;"><strong>Ref No. : </strong></td>
									<td style="padding-top: 10px; padding-bottom: 10px;"><strong>Ref Date : </strong></td>
								</tr>
								<tr>
									<td style="padding-top: 10px; padding-bottom: 10px;"><?php echo $transaction_bill_number; ?></td>
									<td style="padding-top: 10px; padding-bottom: 10px;"><?php echo date("d-M-Y", strtotime($transaction_date)); ?></td>
								</tr>
							</tbody>
						</table>
					</td>
					<td width="60%" style="padding-top: 20px; padding-bottom: 20px;">&nbsp;</td>
				</tr>
			</tbody>
		</table>
		<table width="100%" style="border-top: 1px solid;">
			<tbody>
				<tr>
					<td width="40%" style="padding-bottom: 20px;">
						<table width="100%">
							<tbody>
								<tr class="border-bottom">
									<td style="padding-bottom: 10px;"><strong><?php echo $final_total_amt; ?></strong></td>
								</tr>
								<tr>
									<?php
										$no = round($final_total_amt);
										$point = round($final_total_amt - $no, 2) * 100;
										$hundred = null;
										$digits_1 = strlen($no);
										$i = 0;
										$str = array();
										$words = array('0' => '', '1' => 'one', '2' => 'two',
										'3' => 'three', '4' => 'four', '5' => 'five', '6' => 'six',
										'7' => 'seven', '8' => 'eight', '9' => 'nine',
										'10' => 'ten', '11' => 'eleven', '12' => 'twelve',
										'13' => 'thirteen', '14' => 'fourteen',
										'15' => 'fifteen', '16' => 'sixteen', '17' => 'seventeen',
										'18' => 'eighteen', '19' =>'nineteen', '20' => 'twenty',
										'30' => 'thirty', '40' => 'forty', '50' => 'fifty',
										'60' => 'sixty', '70' => 'seventy',
										'80' => 'eighty', '90' => 'ninety');
										$digits = array('', 'hundred', 'thousand', 'lakh', 'crore');
										 while ($i < $digits_1) {
											$divider = ($i == 2) ? 10 : 100;
											$number = floor($no % $divider);
											$no = floor($no / $divider);
											$i += ($divider == 10) ? 1 : 2;
											if ($number) {
												$plural = (($counter = count($str)) && $number > 9) ? 's' : null;
												$hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
												$str [] = ($number < 21) ? $words[$number] ." " . $digits[$counter] . $plural . " " . $hundred : $words[floor($number / 10) * 10]. " " . $words[$number % 10] . " ". $digits[$counter] . $plural . " " . $hundred;
											} else $str[] = null;
										}
										$str = array_reverse($str);
										$result = implode('', $str);
										$points = ($point) ? "." . $words[$point / 10] . " " . $words[$point = $point % 10] : '';
									?>
									<td style="padding-top: 30px; padding-bottom: 10px;"><strong><?php echo ucfirst($result). "Only"; ?><br>(Cheque Subject To Realisation)</strong></td>
								</tr>
							</tbody>
						</table>
					</td>
					<td width="20%" style="padding-top: 5px; padding-bottom: 20px;">&nbsp;</td>
					<td width="40%" style="padding-top: 5px; padding-bottom: 20px;">
						<table width="100%">
							<tbody>
								<tr>
									<td>
										<?php
											$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.transaction_id='$tid'");
											while($fetch_product=mysqli_fetch_assoc($res))
											{
												extract($fetch_product);
												if($sign_image!="")
												{	
													$inv_sign="retailer_bill_signature/".$sign_image;
												}
												else 
												{
													$inv_sign='';
												}
											}
										?>
										<div class="center-justified" style="padding-left: 5px;">
											<strong>Customer Signature :</strong><?php if($inv_sign!=''){ ?><br><img src="<?php echo $inv_sign; ?>" style="height: 60px;"><?php }else{ ?>
												<pre>


													


												</pre>
											<?php } ?>
										</div>
									</td>
								</tr>
								<tr>
									<td style="padding-bottom: 10px;"><strong><?php echo 'for '.$user_name_dis; ?></strong></td>
								</tr>
								<tr>
									<td style="padding-top: 30px; padding-bottom: 30px;"><strong>Authorised Signatory</strong></td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
	<div style="width: 100%;margin: 0 auto; margin-left: 5%; margin-right: 5%;">
		<table style="width: 700px;">
			<tbody>
				<tr>
					<td>Note : This is computer generated bill and does not require signature!</td>
					<td class="right">Powered by Bell Technology</td>
				</tr>
			</tbody>
		</table>
	</div>
<?php
	}
	else 
	{
		
			$res_invoice = mysqli_query($con,"select bill_type from tbl_party_transaction where tbl_party_transaction.transaction_id='$tid'");
			while($fetch_invoice=mysqli_fetch_assoc($res_invoice))
			{
				$invoice_type_final=$fetch_invoice['bill_type'];
			}
			if($fetch_txn_receipt['serial_no_bill']=='Yes')
			{
?>
			<br><div id="page-wrap" style="border: 1px solid;">
				<table width="100%">
					<tbody>
						<?php if($dis_image==""){ ?>
						<tr class="border-bottom">
							<td class="center">
								<h1><?php echo $invoice_type_final; ?></h1><br>
								<h1><?php echo $user_name_dis; ?></h1><br>
								<?php echo $distributor_address; ?><br>
								<?php echo $distributor_email." , ".$distributor_phone.", ".$distributor_mobile; ?>,<br>
								<h3>GSTIN : <?php echo $gstin_no_dis; ?></h3><br>
							</td>
						</tr>
						<?php }else{ ?>
						<tr class="border-bottom">
							<td width="10%">
								<img src="<?php echo $destination; ?>" height="100">
							</td>
							<td width="90%" class="center">
								<h1><?php echo $invoice_type_final; ?></h1><br>
								<h1><?php echo $user_name_dis; ?></h1><br>
								<?php echo $distributor_address; ?><br>
								<?php echo $distributor_email." , ".$distributor_phone.", ".$distributor_mobile; ?>,<br>
								<h3>GSTIN : <?php echo $gstin_no_dis; ?></h3><br>
							</td>
						</tr>
						<?php } ?>
					</tbody>
				</table>
				<table width="100%">
					<tbody>
						<?php
							$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.transaction_id='$tid'");
							while($fetch_product=mysqli_fetch_assoc($res))
							{
								extract($fetch_product);
								
								$total_amt=$total_amount;
								$discount_amt=$disc_amt;
								$net_amt=$final_amt;
								$round_amount=$round_off_amt;
								$payment_mode1=$payment_mode;
								$bank_name1=$bank_name;
								$cheque_date1=$cheque_date;
								$cheque_no1=$cheque_no;
								$bill_cheque_amt=$cheque_amount;
								$bill_remark=$remark;
								if($payment_mode!="Both")
									$final_payment_mode=$payment_mode;
								else
									$final_payment_mode="Cash & Cheque";
								if($sign_image!="")
								{	
									$inv_sign="retailer_bill_signature/".$sign_image;
								}
								else 
								{
									$inv_sign='';
								}
						?>
						<tr class="border-bottom">
							<td class="border-right">
								<strong><?php if($invoice_type_final=="Tax Invoice"){ ?>Invoice No<?php }else{?>Challan No<?php } ?> : <?php echo $transaction_bill_number; ?></strong><br>
								<strong>Date of Invoice : <?php echo date("d-M-Y", strtotime($transaction_date)); ?></strong><br>
								<strong>Payment Mode : <?php echo $final_payment_mode; ?></strong><br>
							</td>
							<td>
								<strong>Place of Supply : <?php echo $place_of_supply." ".$party_code; ?></strong><br>
								<strong>Reverse Charge (Y / N) : N</strong><br>
							</td>
						</tr>
					<?php } ?>
					</tbody>
				</table>
				<table width="100%">
					<tbody>
						<tr>
							<td class="border-right" width="33%">
								<strong>Billed to : </strong><br>
								<?php echo $party_name.' '.$party_phone.'<br>'.$party_address; ?><br>
								GSTIN/UIN : <?php echo $gstin_no; ?><br>
							</td>
							<td class="border-right" width="33%">
								<strong>Shipped to : </strong><br>
								<?php echo $party_name.' '.$party_phone.'<br>'.$party_address; ?><br>
								GSTIN/UIN : <?php echo $gstin_no; ?><br>
							</td>
							<td width="34%">
								<strong>Tracking Details : </strong><br>
								Docket No : <?php echo $courier_no; ?><br>
								Courier Agency : <?php echo $courier_company; ?><br>
								Courier Date : <?php echo date("d-M-Y", strtotime($courier_date)); ?><br>
							</td>
						</tr>
					</tbody>
				</table>
				<table width="100%" class="outline-table">
					<tbody>
						<tr class="border-bottom center">
							<td class="border-right"><strong>#</strong></td>
							<td class="border-right"><strong>Item</strong></td>
							<td class="border-right"><strong>HSN Code</strong></td>
							<td class="border-right"><strong>Qty</strong></td>
							<td class="border-right"><strong>Price</strong></td>
							<td class="border-right"><strong>GST</strong></td>
							<td class="border-right" class="border-right"><strong>GST %</strong></td>
							<td><strong>Total Amt</strong></td>
						</tr>
						<?php 
							$total_cgst=0;
							$total_sgst=0;
							$total_igst=0;
							$total_final_amt=0;
							$c=1;
							$res_hsn = mysqli_query($con,"select tbl_product.product_id,sum(tbl_party_transaction_detail.quantity) as sumquan,tbl_party_transaction_detail.product_price,sum(tbl_party_transaction_detail.CGST_amount) as total_cgst_hsn_val,sum(tbl_party_transaction_detail.SGST_amount) as total_sgst_hsn_val,tbl_product.CGST,tbl_product.SGST,tbl_party_transaction_detail.product_name,tbl_product.hsn_code,sum(tbl_party_transaction_detail.IGST_amount) as total_igst_hsn_val,tbl_product.IGST  from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid' group by tbl_product.product_id");
							while($fetch_hsn=mysqli_fetch_assoc($res_hsn))
							{
								$product_id_val=$fetch_hsn['product_id'];
								$hsn_total_amount=0;
								$hsn_items=$fetch_hsn['product_name']." - ";
								$hsn_item_detail='';
								$hj=0;
								$res11 = mysqli_query($con,"select tbl_party_transaction_detail.CGST_amount,tbl_party_transaction_detail.SGST_amount,tbl_party_transaction_detail.IMEI_NO,tbl_party_transaction_detail.IGST_amount from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid' and tbl_product.product_id='$product_id_val'");    
								while($fetch_product11=mysqli_fetch_assoc($res11))
								{
									extract($fetch_product11);
									if($hsn_code=="")
										$hsn_code="N/A";
									$hj++;
									$total_cgst=$total_cgst+$CGST_amount;
									$total_sgst=$total_sgst+$SGST_amount;
									$total_igst=$total_igst+$IGST_amount;
									$total_final_amt=$total_final_amt+($fetch_hsn['product_price']*1);
									if($CGST_amount>0)
										$gst_inter="Yes";
									else
									if($CGST_amount==0 && $IGST_amount==0)
										$gst_inter="Yes";
									else
										$gst_inter="No";
									
									$hsn_total_amount=$hsn_total_amount+($fetch_hsn['product_price']*1);
									if($hj==1)
										$hsn_item_detail=$hsn_item_detail.$IMEI_NO;
									else
									{
										$hsn_item_detail=$hsn_item_detail.','.$IMEI_NO;
									}
								}
						?>
						<tr>
							<td class="border-right center"><?php echo $c++; ?></td>
							<td class="border-right center"><?php echo $hsn_items."<br>".$hsn_item_detail; ?></td>
							<td class="border-right center"><?php echo $fetch_hsn['hsn_code']; ?></td>
							<td class="border-right center"><?php echo $fetch_hsn['sumquan']; ?></td>
							<td class="border-right center"><?php echo $fetch_hsn['product_price']; ?></td>
							<td class="border-right center"><?php echo $fetch_hsn['total_cgst_hsn_val']+$fetch_hsn['total_sgst_hsn_val']+$fetch_hsn['total_igst_hsn_val']; ?></td>

							<td class="border-right center">
								<?php
								if($gst_inter=="Yes")
								{
									echo $fetch_hsn['CGST']+$fetch_hsn['SGST'];
								}
								else{
									echo $fetch_hsn['IGST'];
								}
								?>
							</td>
							<td class="center"><?php echo round($hsn_total_amount,2); ?></td>
						</tr><?php } ?>
					</tbody>
				</table>
				<?php
					for($bn=$c;$bn<=18;$bn++){
						echo '<br clear="all"><br>';
					}
				?>
				<table width="100%">
					<tbody>
						<?php if($bill_remark!=""){ ?>
						<tr class="border-bottom border-top">
							<td colspan="7">Remark : <?php echo $bill_remark; ?></td>
						</tr>
						<?php } ?>
						<tr class="border-bottom">
							<td><strong>Total Amt <?php echo $total_amt; ?> </strong></td>
							<td></td>
							<td><strong>Discount <?php echo $discount_amt; ?></strong></td>
							<td></td>
							<td><strong>Round Off (+) <?php if($round_amount<0){ $round_amt_explode=explode("-",$round_amount);echo $round_amt_explode[1];}else{echo $round_amount;}?></strong></td>
							<td></td>
							<td><strong>Net Amt <?php echo $net_amt; ?></strong></td>
						</tr>
						<tr class="border-bottom">
							<td><strong>Taxable Amt</strong></td>
							<td><strong>CGST</strong></td>
							<td><strong>SGST</strong></td>
							<td><strong>IGST</strong></td>
							<td><strong>Total Tax</strong></td>
							<td>&nbsp;</td>
							<td>&nbsp;</td>
						</tr>
						<tr>
							<td><strong><?php echo round($total_final_amt-($total_cgst+$total_sgst+$total_igst+$discount_amt),2); ?></strong></td>
							<?php if($gst_inter=="Yes"){ ?>
							<td><strong><?php echo $total_cgst; ?></strong></td>
							<td><strong><?php echo $total_sgst; ?></strong></td>
							<td><strong><?php echo "-"; ?></strong></td>
							<?php }else{ ?>
							<td><strong><?php echo "-"; ?></strong></td>
							<td><strong><?php echo "-"; ?></strong></td>
							<td><strong><?php echo $total_igst; ?></strong></td>
							<?php } ?>
							<td><strong><?php echo $total_cgst+$total_sgst+$total_igst; ?></strong></td>
							<td>&nbsp;</td>
							<td>&nbsp;</td>
						</tr>
					</tbody>
				</table>
				<table width="100%" class="outline-table">
					<tbody>
						<?php
							$no = round($net_amt);
							$point = round($net_amt - $no, 2) * 100;
							$hundred = null;
							$digits_1 = strlen($no);
							$i = 0;
							$str = array();
							$words = array('0' => '', '1' => 'one', '2' => 'two',
							'3' => 'three', '4' => 'four', '5' => 'five', '6' => 'six',
							'7' => 'seven', '8' => 'eight', '9' => 'nine',
							'10' => 'ten', '11' => 'eleven', '12' => 'twelve',
							'13' => 'thirteen', '14' => 'fourteen',
							'15' => 'fifteen', '16' => 'sixteen', '17' => 'seventeen',
							'18' => 'eighteen', '19' =>'nineteen', '20' => 'twenty',
							'30' => 'thirty', '40' => 'forty', '50' => 'fifty',
							'60' => 'sixty', '70' => 'seventy',
							'80' => 'eighty', '90' => 'ninety');
							$digits = array('', 'hundred', 'thousand', 'lakh', 'crore');
							 while ($i < $digits_1) {
								$divider = ($i == 2) ? 10 : 100;
								$number = floor($no % $divider);
								$no = floor($no / $divider);
								$i += ($divider == 10) ? 1 : 2;
								if ($number) {
									$plural = (($counter = count($str)) && $number > 9) ? 's' : null;
									$hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
									$str [] = ($number < 21) ? $words[$number] ." " . $digits[$counter] . $plural . " " . $hundred : $words[floor($number / 10) * 10]. " " . $words[$number % 10] . " ". $digits[$counter] . $plural . " " . $hundred;
								} else $str[] = null;
							}
							$str = array_reverse($str);
							$result = implode('', $str);
							$points = ($point) ? "." . $words[$point / 10] . " " . $words[$point = $point % 10] : '';
						?>
						<tr class="border-bottom">
							<td colspan="2" style="vertical-align: top;text-align: left;"><h2>Total Amount (In Words) : </h2><strong><?php echo ucfirst($result);?> Only</strong></td>
							<td colspan="2" style="vertical-align: top;text-align: left;"><h2>Bill Details</h2><strong>Bank Name : <?php echo $dis_bank_name; ?><br>Branch : <?php echo $dis_account_name; ?><br>IFSC Code : <?php echo $dis_ifsc_no; ?> , Account No :<?php echo $dis_account_no; ?></strong></td>
						</tr>
						<?php if($payment_mode1=="Cheque" || $payment_mode1=="Both"){?>
							<tr>
								<td>Bank Name : <?php echo $bank_name1; ?></td>
								<td>Cheque No : <?php echo $cheque_no1; ?></td>
								<td>Cheque Amount : <?php echo $bill_cheque_amt; ?></td>
								<td>Cheque Date :<?php echo date("d-M-Y", strtotime($cheque_date1)); ?></td>
							</tr>
						<?php } ?>
					</tbody>
				</table>
				<table width="100%">
					<tbody>
						<tr>
							<td width="60%" style="vertical-align: top;text-align: left;">
								<div class="center-justified" style="font-size: 10px;"><strong>Terms & Conditions </strong><br>
									E.& O.E..<br>
									<?php
										if($lng=='hnd')	
											$res_terms = mysqli_query($con,"select * from tbl_dist_terms_conditions_hindi where distributor_id='$ver'");
										else
											$res_terms = mysqli_query($con,"select * from tbl_dist_terms_conditions where distributor_id='$ver'");
										$a_terms=mysqli_fetch_array($res_terms);
										$tc_srNO=1;
										if($a_terms['terms_condition1']!=''){
											echo '1. '.$a_terms['terms_condition1'].'<br>';
										}
										if($a_terms['terms_condition2']!=''){
											echo '2. '.$a_terms['terms_condition2'].'<br>';
										}
										if($a_terms['terms_condition3']!=''){
											echo '3. '.$a_terms['terms_condition3'].'<br>';
										}

										if($a_terms['terms_condition4']!=''){
											echo '4. '.$a_terms['terms_condition4'].'<br>';
										}

										if($a_terms['terms_condition5']!=''){
											echo '5. '.$a_terms['terms_condition5'].'<br>';
										}
										if($a_terms['terms_condition6']!=''){
											echo '6. '.$a_terms['terms_condition6'].'<br>';
										}
										if($a_terms['terms_condition7']!=''){
											echo '7. '.$a_terms['terms_condition7'];
										}
									?>
								</div>
							</td>
							<td width="40%">
								<div class="center-justified" style="padding-left: 5px;">
								<strong>Customer Signature :</strong><?php if($inv_sign!=''){ ?><br><br><img src="<?php echo $inv_sign; ?>" style="height: 50px;"><?php } if($inv_sign=''){ ?><br><br><br><br><br><br><?php } ?>
							</div>
							</td>
						</tr>
						<tr>
							<td></td>
							<td>For <?php echo $user_name_dis; ?></td>
						</tr>
						<p>&nbsp;</p>
					</tbody>
				</table>
			</div>
			<div style="width: 100%;margin: 0 auto; margin-left: 5%; margin-right: 5%;">
				<table style="width: 700px;">
					<tbody>
						<tr>
							<td>Note : This is computer generated bill and does not require signature!</td>
							<td class="right">Powered by Bell Technology</td>
						</tr>
					</tbody>
				</table>
			</div>
<?php
			}
			else
			{
				$check_bill_type = mysqli_query($con,"select tbl_product.product_type from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$tid' group by tbl_party_transaction_detail.transaction_id");
				while($fetch_check_bill=mysqli_fetch_assoc($check_bill_type))
				{
					$bill_pro_type=$fetch_check_bill['product_type'];
					if($bill_pro_type=="Service" || $bill_pro_type=='RET PAYOUT')
					{
				?>
				<br><div id="page-wrap" style="border: 1px solid;">
					<table width="100%">
						<tbody>
							<tr class="border-bottom">
								<?php if($dis_image==""){ ?>
								<td class="center">
									<h1 style="font-size:16px;"><?php echo $invoice_type_final; ?></h1>
									<h1><?php echo $user_name_dis; ?></h1><br>
									<?php echo $distributor_address; ?><br>
									<?php echo $distributor_email2; ?> , <?php echo $distributor_phone; ?>, <?php echo $distributor_mobile; ?><br>
									<h3>GSTIN : <?php echo $gstin_no_dis; ?></h3><br>
								</td>
								<?php }else{ ?>
								<td width="10%">
									<img src="<?php echo $destination; ?>" height="100">
								</td>
								<td width="90%" class="center">
									<h1 style="font-size:16px;"><?php echo $invoice_type_final; ?></h1>
									<h1><?php echo $user_name_dis; ?></h1><br>
									<?php echo $distributor_address; ?><br>
									<?php echo $distributor_email2; ?> , <?php echo $distributor_phone; ?>, <?php echo $distributor_mobile; ?><br>
									<h3>GSTIN : <?php echo $gstin_no_dis; ?></h3><br>
								</td>
								<?php } ?>
							</tr>
						</tbody>
					</table>
					<table width="100%">
						<tbody>
							<?php
								$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.transaction_id='$tid'");
								while($fetch_product=mysqli_fetch_assoc($res))
								{
									extract($fetch_product);
									
									$total_amt=$total_amount;
									$discount_amt=$disc_amt;
									$net_amt=$final_amt;
									$round_amount=$round_off_amt;
									$payment_mode1=$payment_mode;
									$bank_name1=$bank_name;
									$cheque_date1=$cheque_date;
									$cheque_no1=$cheque_no;
									$tds_commission=0;
									$tds_amt_final=$tds_amt;
									$bill_cheque_amt=$cheque_amount;
									$bill_remark=$remark;
									if($sign_image!="")
									{	
										$inv_sign="retailer_bill_signature/".$sign_image;
									}
									else 
									{
										$inv_sign='';
									}
									
									if($payment_mode!="Both")
										$final_payment_mode=$payment_mode;
									else
										$final_payment_mode="Cash & Cheque";
							?>
							<tr class="border-bottom">
								<td class="border-right" width="50%" style="vertical-align: top;text-align: left;font-size:15px;">
									<strong><?php if($invoice_type_final=="Tax Invoice"){ ?>Invoice No<?php }else{?>Challan No<?php } ?> : </strong><?php echo $transaction_bill_number; ?><br>
									<strong>Date of Invoice : </strong><?php echo date("d-M-Y", strtotime($transaction_date)); ?><br>
									<strong>Payment Mode : </strong><?php echo $final_payment_mode; ?><br>
								</td>
								<td width="50%" style="vertical-align: top;text-align: left;font-size:15px;">
									<strong>Place of Supply : </strong><?php echo $place_of_supply; ?> <?php echo $party_code; ?><br>
									<strong>Reverse Charge (Y / N) : </strong>N<br>
								</td>
							</tr>
							<tr>
								<td class="border-right" width="50%" style="vertical-align: top;text-align: left;font-size:13px;">
									<strong style="font-size:15px;">Billed to : </strong><br>
									<?php echo $party_name.' '.$party_phone.'<br>'.$party_address; ?><br>
									GSTIN/UIN : <?php echo $gstin_no; ?><br>
									<?php if($pan_it_no!=""){ ?>
									Pan No : <?php echo $pan_it_no; } ?>
								</td>
								<td width="50%" style="vertical-align: top;text-align: left;font-size:13px;">
									<strong style="font-size:15px;">Shipped to : </strong><br>
									<?php echo $party_name.' '.$party_phone.'<br>'.$party_address; ?><br>
									GSTIN/UIN : <?php echo $gstin_no; ?><br>
									<?php if($pan_it_no!=""){ ?>
									Pan No : <?php echo $pan_it_no; } ?>
								</td>
							</tr>
						<?php } ?>
						</tbody>
					</table>
					<table width="100%" class="outline-table">
						<tbody>
							<tr class="border-bottom center">
								<td class="border-right" style="font-size:13px;"><strong>#</strong></td>
								<td class="border-right" style="font-size:13px;"><strong>Item</strong></td>
								<td class="border-right" style="font-size:13px;"><strong>HSN Code</strong></td>
								<td class="border-right" style="font-size:13px;"><strong>Qty</strong></td>
								<td class="border-right" style="font-size:13px;"><strong>Price</strong></td>
								<td class="border-right" style="font-size:13px;"><strong>Discount</strong></td>
								<td class="border-right" style="font-size:13px;"><strong>GST</strong></td>
								<td class="border-right" style="font-size:13px;" class="border-right"><strong>GST %</strong></td>
								<td style="font-size:13px;"><strong>Total Amt</strong></td>
							</tr>
							<?php 
								$total_cgst=0;
								$total_sgst=0;
								$total_igst=0;
								$total_final_amt=0;
								$total_qty=0;
								$c=1;
								$res11 = mysqli_query($con,"select tbl_party_transaction_detail.CGST_amount,tbl_party_transaction_detail.SGST_amount,tbl_party_transaction_detail.product_price,tbl_party_transaction_detail.quantity,tbl_party_transaction_detail.product_name,tbl_product.hsn_code,tbl_product.CGST,tbl_product.SGST,tbl_party_transaction_detail.IGST_amount,tbl_product.IGST,tbl_party_transaction_detail.actual_quantity,tbl_party_transaction_detail.product_disc from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid'");    
								while($fetch_product11=mysqli_fetch_assoc($res11))
								{
									extract($fetch_product11);
									if($hsn_code=="")
										$hsn_code="N/A";
									$total_cgst=$total_cgst+$CGST_amount;
									$total_sgst=$total_sgst+$SGST_amount;
									$total_igst=$total_igst+$IGST_amount;
									$total_qty=$total_qty+$quantity;
									$total_final_amt=$total_final_amt+round($product_price*$quantity,2);
									if($CGST_amount>0)
										$gst_inter="Yes";
									else
									if($CGST_amount==0 && $IGST_amount==0)
										$gst_inter="Yes";
									else
										$gst_inter="No";
									$tds_commission=$actual_quantity;
							?>
							<tr>
								<td class="border-right center"><?php echo $c++; ?></td>
								<td class="border-right center"><?php echo $product_name; ?></td>
								<td class="border-right center"><?php echo $hsn_code; ?></td>
								<td class="border-right center"><?php echo $quantity; ?></td>
								<td class="border-right center"><?php echo $product_price; ?></td>
								<td class="border-right center"><?php echo $product_disc; ?></td>
								<td class="border-right center"><?php echo $CGST_amount+$SGST_amount+$IGST_amount; ?></td>

								<td class="border-right center">
									<?php 
										if($gst_inter=="Yes"){
											echo $CGST+$SGST;
										}
										else{
											echo $IGST;
										} 
									?>
								</td>
								<?php if($dis_operator=="Jio" && $tds_amt_final>0 && $discount_amt>0){ ?>
								<td class="center"><?php echo $total_amt-$tds_amt_final-$discount_amt; ?></td>
								<?php }else{ if($dis_operator=="Jio" && $tds_amt_final>0){ ?>
								<td class="center"><?php echo $total_amt-$tds_amt_final; ?></td>
								<?php }else{ ?>
								<td class="center"><?php echo round($product_price*$quantity,2); ?></td>
								<?php } } ?>
								?>
							</tr>
							<?php } ?>
						</tbody>
					</table>
					<?php
						for($space=$c;$space<=15;$space++){
							echo '<br clear="all"><br>';
						}  
					?>
					<table width="100%">
						<tbody>
							<?php if($bill_remark!=""){ ?>
							<tr class="border-bottom border-top">
								<td colspan="7">Remark : <?php echo $bill_remark; ?></td>
							</tr>
							<?php } ?>
							<tr class="border-bottom <?php if($bill_remark==""){ echo "border-top";} ?>">
								<?php if($dis_operator=="Jio" && $tds_amt_final>0){ ?>
								<td><strong>Total Amt : </strong> <?php echo $total_amt; ?></td>
								<td><strong>Discount : </strong> <?php echo $discount_amt; ?></td>
								<td></td>
								<td><strong>Round Off : </strong><?php if($round_amount<0){ $round_amt_explode=explode("-",$round_amount); echo "(-) ".$round_amt_explode[1]; } else { echo "(+) ".$round_amount; } ?></td>
								<td><strong>Commission : </strong> <?php echo $tds_commission; ?></td>
								<td><strong>TDS : </strong> <?php echo $tds_amt_final; ?></td>
								<td><strong>Net Amt : </strong> <?php echo $net_amt; ?></td>
								<?php }else{ ?>
								<td><strong>Total Amt : </strong> <?php echo $total_amt; ?></td>
								<td></td>
								<td><strong>Discount : </strong> <?php echo $discount_amt; ?></td>
								<td></td>
								<td><strong>Round Off : </strong><?php if($round_amount<0){ $round_amt_explode=explode("-",$round_amount); echo "(-) ".$round_amt_explode[1]; } else { echo "(+) ".$round_amount;}?></td>
								<td></td>
								<td><strong>Net Amt : </strong> <?php echo $net_amt; ?></td>
								<?php } ?>
							</tr>
							<tr class="center">
								<td>&nbsp;</td>
								<td class="border-bottom"><strong>Taxable Amt</strong></td>
								<td class="border-bottom"><strong>CGST</strong></td>
								<td class="border-bottom"><strong>SGST</strong></td>
								<td class="border-bottom"><strong>IGST</strong></td>
								<td class="border-bottom"><strong>Total Tax</strong></td>
								<td>&nbsp;</td>
							</tr>
							<tr class="center">
								<td>&nbsp;</td>
								<td><strong><?php if($dis_operator=="Jio" && $tds_amt_final>0 && $discount_amt>0){ echo round($total_amt-($total_cgst+$total_sgst+$total_igst+$tds_amt_final+$discount_amt),2);}else{ if($dis_operator=="Jio" && $tds_amt_final>0){ echo round($total_amt-($total_cgst+$total_sgst+$total_igst+$tds_amt_final+$discount_amt),2);}else{ echo round($total_final_amt-($total_cgst+$total_sgst+$total_igst+$discount_amt),2);} } ?></strong></td>
								<?php if($gst_inter=="Yes"){ ?>
								<td><strong><?php echo $total_cgst; ?></strong></td>
								<td><strong><?php echo $total_sgst; ?></strong></td>
								<td><strong><?php echo "-"; ?></strong></td>
								<?php }else{ ?>
								<td><strong><?php echo "-"; ?></strong></td>
								<td><strong><?php echo "-"; ?></strong></td>
								<td><strong><?php echo $total_igst; ?></strong></td>
								<?php } ?>
								<td><strong><?php echo $total_cgst+$total_sgst+$total_igst; ?></strong></td>
								<td>&nbsp;</td>
							</tr>
						</tbody>
					</table>
					<table width="100%" class="outline-table">
						<tbody>
							<?php
								$no = round($net_amt);
								$point = round($net_amt - $no, 2) * 100;
								$hundred = null;
								$digits_1 = strlen($no);
								$i = 0;
								$str = array();
								$words = array('0' => '', '1' => 'one', '2' => 'two',
								'3' => 'three', '4' => 'four', '5' => 'five', '6' => 'six',
								'7' => 'seven', '8' => 'eight', '9' => 'nine',
								'10' => 'ten', '11' => 'eleven', '12' => 'twelve',
								'13' => 'thirteen', '14' => 'fourteen',
								'15' => 'fifteen', '16' => 'sixteen', '17' => 'seventeen',
								'18' => 'eighteen', '19' =>'nineteen', '20' => 'twenty',
								'30' => 'thirty', '40' => 'forty', '50' => 'fifty',
								'60' => 'sixty', '70' => 'seventy',
								'80' => 'eighty', '90' => 'ninety');
								$digits = array('', 'hundred', 'thousand', 'lakh', 'crore');
								 while ($i < $digits_1) {
									$divider = ($i == 2) ? 10 : 100;
									$number = floor($no % $divider);
									$no = floor($no / $divider);
									$i += ($divider == 10) ? 1 : 2;
									if ($number) {
										$plural = (($counter = count($str)) && $number > 9) ? 's' : null;
										$hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
										$str [] = ($number < 21) ? $words[$number] ." " . $digits[$counter] . $plural . " " . $hundred : $words[floor($number / 10) * 10]. " " . $words[$number % 10] . " ". $digits[$counter] . $plural . " " . $hundred;
									} else $str[] = null;
								}
								$str = array_reverse($str);
								$result = implode('', $str);
								$points = ($point) ? "." . $words[$point / 10] . " " . $words[$point = $point % 10] : '';
							?>
							<tr class="border-bottom">
								<td colspan="2" style="vertical-align: top;text-align: left;" class="border-right">
									<strong>Total Amount (In Words) : <?php echo ucfirst($result);?> Only</strong>
								</td>
								<td colspan="2" style="vertical-align: top;text-align: left;"><strong>Bill Details<br>Bank Name : <?php echo $dis_bank_name; ?><br>Branch : <?php echo $dis_account_name; ?><br>IFSC Code : <?php echo $dis_ifsc_no; ?> , Account No :<?php echo $dis_account_no; ?></strong></td>
							</tr>
							<?php if($payment_mode1=="Cheque" || $payment_mode1=="Both"){ ?>
							<tr class="center">
								<td class="border-right"><strong>Bank Name :</strong> <?php echo $bank_name1; ?></td>
								<td class="border-right"><strong>Cheque No :</strong> <?php echo $cheque_no1; ?></td>
								<td class="border-right"><strong>Cheque Amount :</strong> <?php echo $bill_cheque_amt; ?></td>
								<td><strong>Cheque Date :</strong> <?php echo date("d-M-Y", strtotime($cheque_date1)); ?></td>
							</tr>
							<?php } ?>
						</tbody>
					</table>
					<table width="100%">
						<tbody>
							<tr>
								<td width="60%" style="vertical-align: top;text-align: left;">
									<div class="center-justified" style="font-size: 10px;"><strong>Terms & Conditions <br>
										E.& O.E..</strong><br>
										<?php
											if($lng=='hnd')	{
												$res_terms = mysqli_query($con,"select * from tbl_dist_terms_conditions_hindi where distributor_id='$session_dist_ver'");
											}
											else{
												$res_terms = mysqli_query($con,"select * from tbl_dist_terms_conditions where distributor_id='$session_dist_ver'");
											}
											$a_terms=mysqli_fetch_array($res_terms);
											if($a_terms['terms_condition1']!=''){
												echo '1. '.$a_terms['terms_condition1'].'<br>';
											}
											if($a_terms['terms_condition2']!=''){
												echo '2. '.$a_terms['terms_condition2'].'<br>';
											}
											if($a_terms['terms_condition3']!=''){
												echo '3. '.$a_terms['terms_condition3'].'<br>';
											}

											if($a_terms['terms_condition4']!=''){
												echo '4. '.$a_terms['terms_condition4'].'<br>';
											}

											if($a_terms['terms_condition5']!=''){
												echo '5. '.$a_terms['terms_condition5'].'<br>';
											}
											if($a_terms['terms_condition6']!=''){
												echo '6. '.$a_terms['terms_condition6'].'<br>';
											}
											if($a_terms['terms_condition7']!=''){
												echo '7. '.$a_terms['terms_condition7'];
											}
										?>
									</div>
								</td>
								<td width="40%" style="vertical-align: top;text-align: left;">
									<div class="center-justified" style="padding-left: 5px;">
									<strong>Customer Signature :</strong><?php if($inv_sign!=''){ ?><br><br><img src="<?php echo $inv_sign; ?>" style="height: 50px;"><?php } ?>
								</div>
								</td>
							</tr>
							<p>&nbsp;</p>
							<tr>
								<td></td>
								<td style="vertical-align: top;text-align: center;">For <?php echo $user_name_dis; ?><br><br><br><br><br><br><br><br></td>
							</tr>
						</tbody>
					</table>
				</div>
				<div style="width: 100%;margin: 0 auto; margin-left: 5%; margin-right: 5%;">
					<table style="width: 700px;">
						<tbody>
							<tr>
								<td>Note : This is computer generated bill and does not require signature!</td>
								<td class="right">Powered by Bell Technology</td>
							</tr>
						</tbody>
					</table>
				</div>
				<?php
					}
					else
					{
				?>
				<br><div id="page-wrap" style="border: 1px solid;">
					<table width="100%">
						<tbody>
							<tr class="border-bottom">
								<td class="center" style="padding:1%;">
									<h1 style="font-size:20px;"><?php echo $invoice_type_final; ?></h1>
								</td>
							</tr>
						</tbody>
					</table>
					<table width="100%">
						<tbody>
						<?php
						$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.transaction_id='$tid'");
						while($fetch_product=mysqli_fetch_assoc($res))
						{
							extract($fetch_product);
							$total_amt=$total_amount;
							$discount_amt=$disc_amt;
							$final_cess_amt=$cess_amount;
							$round_amount=$round_off_amt;
							$net_amt=$final_amt;
							$bill_cheque_amt=$cheque_amount;
							$payment_mode1=$payment_mode;
							$bank_name1=$bank_name;
							$cheque_date1=$cheque_date;
							$cheque_no1=$cheque_no;
							$labour_amt=$labour_charges;
							$freight_amt=$freight_charges;
							$other_exp_amt=$other_expenses;
							if($sign_image!="")
							{	
								$inv_sign="retailer_bill_signature/".$sign_image;
							}
							else 
							{
								$inv_sign='';
							}
							if($payment_mode!="Both")
								$final_payment_mode=$payment_mode;
							else
								$final_payment_mode="Cash & Cheque";		
							?>
							<tr class="border-bottom">
								<td width="60%" class="border-right" style="padding-left:1%;">
									<h3><?php echo $user_name_dis; ?></h3><br>
									<?php echo $distributor_address; ?><br>
									
									<b>GSTIN : </b><?php echo $gstin_no_dis; ?><br><b>State Name : </b>
									<?php echo $place_supply; ?>  ,  <b>Code : </b><?php echo $code_no; ?>,<br>
								</td>
								<td width="30%" class="border-right">
									<table width="100%" cellpadding="1%">
										<tbody>
											<tr>
												<td>
													<strong><?php if($invoice_type_final=="Tax Invoice"){ ?>Invoice No<?php }else{?>Challan No<?php } ?> : <?php echo $transaction_bill_number; ?></strong>
												</td>
											</tr>
											<tr>
												<td>
													Date of Invoice : <?php echo date("d-M-Y", strtotime($transaction_date)); ?>
												</td>
											</tr>
											<tr>
												<td style="border-bottom: solid thick #FFF;">
													Payment Mode : <?php echo $final_payment_mode; ?>
												</td>
											</tr>
										</tbody>
									</table>
									
								</td>
								<td width="10%">
									<img src="<?php echo $destination; ?>" height="100">
								</td>
							</tr>
						</tbody>
						<?php } ?>
					</table>
					<table width="100%">
						<tbody>
							<tr>
								<td class="border-right" width="57.4%" style="padding:1%;">
									<strong style="font-size:15px;">Buyer</strong><br>
									<?php echo $party_name.' '.$party_phone.'<br>'.$party_address; ?><br>
									GSTIN/UIN : <?php echo $gstin_no; ?><br>
									Docket No : <?php echo $reference_no; ?><br>
									Courier Agency : <?php echo $courier_company; ?><br>
									Courier Date : <?php echo date("d-M-Y", strtotime($courier_date)); ?><br>
									State Name : <?php echo $place_of_supply; ?> &nbsp; &nbsp; &nbsp; &nbsp;Code : <?php echo $party_code; ?>
								</td>
								<td width="42.6%" style="vertical-align: top;text-align: left; padding:1%;" >
									<strong style="font-size:15px;">Terms of Delivery</strong><br>
									<?php echo $terms_of_delivery; ?>
								</td>
							</tr>
						</tbody>
					</table>
					<table width="100%">
						<tbody>
							<tr class="center border-top">
								<td class="border-right"><strong>#</strong></td>
								<td class="border-right"><strong>Description of Goods</strong></td>
								<td class="border-right"><strong>HSN</strong></td>
								<td class="border-right"><strong>Price</strong></td>
								<td class="border-right"><strong>Qty</strong></td>
								<td class="border-right"><strong>Discount</strong></td>
								<td class="border-right border-bottom" colspan="3"><strong>Amount</strong></td>
								<td><strong>Total Amount</strong></td>
							</tr>
							<tr class="border-bottom center">
								<td class="border-right"></td>
								<td class="border-right"></td>
								<td class="border-right"></td>
								<td class="border-right"></td>
								<td class="border-right"></td>
								<td class="border-right"></td>
								<td class="border-right"><strong>GST</strong></td>
								<td class="border-right"><strong>Taxable</strong></td>
								<td class="border-right"><strong>cess</strong></td>
								<td></td>
							</tr>
							<?php 
								$c=0;
								$res11 = mysqli_query($con,"select tbl_party_transaction_detail.CGST_amount,tbl_party_transaction_detail.SGST_amount,tbl_party_transaction_detail.product_price,tbl_party_transaction_detail.quantity,tbl_party_transaction_detail.product_name,tbl_product.hsn_code,tbl_product.CGST,tbl_product.SGST,tbl_party_transaction_detail.cess_pc_amt as cesspamt,tbl_party_transaction_detail.cess_percentage as cesspencentage,tbl_party_transaction_detail.cess_final_amt,tbl_party_transaction_detail.product_disc,tbl_party_transaction_detail.IGST_amount,tbl_product.IGST from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid'");    
								while($fetch_product11=mysqli_fetch_assoc($res11))
								{
									extract($fetch_product11);
									if($hsn_code=="")
										$hsn_code="N/A";
									$c++;
									?>
										<tr class="border-bottom">
											<td class="border-right center" style="font-size:12px;"><?php echo $c; ?></td>
											<td class="border-right center" style="font-size:12px;"><?php echo $product_name; ?></td>
											<td class="border-right center" style="font-size:12px;"><?php echo $hsn_code; ?></td>
											<td class="border-right center" style="font-size:12px;"><?php echo $product_price; ?></td>
											<td class="border-right center" style="font-size:12px;"><?php echo $quantity; ?></td>
											<td class="border-right center" style="font-size:12px;"><?php echo round($product_disc,2); ?></td>
											<td class="border-right center" style="font-size:12px;"><?php echo $SGST_amount+$CGST_amount+$IGST_amount; ?></td>
											<?php if($dist_gst_config=="Inclusive"){ ?>
											<td class="border-right center" style="font-size:12px;"><?php echo floor(($product_price*$quantity-$product_disc-$SGST_amount-$CGST_amount-$IGST_amount)*100)/100; ?></td>
											<?php }else{ ?>
											<td class="border-right center" style="font-size:12px;"><?php echo floor(($product_price*$quantity-$product_disc)*100)/100; ?></td>
											<?php } ?>
											<td class="border-right center" style="font-size:12px;"><?php echo floor(($cess_final_amt)*100)/100; ?></td>
											<?php if($dist_gst_config=="Inclusive"){ ?>
											<td class="center" style="font-size:12px;"><?php echo floor(($product_price*$quantity+$cess_final_amt-$product_disc)*100)/100; ?></td>
											<?php }else{ ?>
											<td class="center" style="font-size:12px;"><?php echo floor(($product_price*$quantity+$cess_final_amt-$product_disc+$SGST_amount+$CGST_amount+$IGST_amount)*100)/100; ?></td>
											<?php } ?>
										</tr>
									<?php } ?>
						</tbody>
					</table>
					<?php
						for($space=$c;$space<=28;$space++){
							echo '<br clear="all">';
						}  
					?>
					<table width="100%">
						<tbody>
							<tr class="border-bottom border-top">
								<td style="padding-left:1%;"><strong>Freight Charges : </strong><?php echo $freight_amt; ?>&nbsp;&nbsp;</td>
								<td style="text-align:center;"><strong>Labour Charges : </strong><?php echo $labour_amt; ?>&nbsp;&nbsp;</td>
								<td style="padding-right:10px;text-align:right;"><strong>Other Charges : </strong><?php echo $other_exp_amt; ?>&nbsp;&nbsp;</td>
							</tr>
						</tbody>
					</table>
					<table width="100%">
						<tbody>
							<tr class="border-bottom">
								<td style="padding-left:1%;"><strong>Total Amt : </strong>&nbsp;&nbsp;<?php echo $total_amt; ?> </td>
								<td style="text-align:center;"><strong>Discount : </strong>&nbsp;&nbsp;<?php echo $discount_amt; ?></td>
								<td style="text-align:center;"><strong>Round Off : </strong>&nbsp;&nbsp;<?php if($round_amount<0){ $round_amt_explode=explode("-",$round_amount); echo "(-) ".$round_amt_explode[1]; } else { echo "(+) ".$round_amount; } ?></td>
								<td style="padding-right:10px;text-align:right;"><strong>Net Amt : </strong>&nbsp;&nbsp;<?php echo $net_amt; ?> (INR)</td>
							</tr>
							<tr class="border-bottom">
								<?php
									$no = round($net_amt);
									$point = round($net_amt - $no, 2) * 100;
									$hundred = null;
									$digits_1 = strlen($no);
									$i = 0;
									$str = array();
									$words = array('0' => '', '1' => 'one', '2' => 'two',
									'3' => 'three', '4' => 'four', '5' => 'five', '6' => 'six',
									'7' => 'seven', '8' => 'eight', '9' => 'nine',
									'10' => 'ten', '11' => 'eleven', '12' => 'twelve',
									'13' => 'thirteen', '14' => 'fourteen',
									'15' => 'fifteen', '16' => 'sixteen', '17' => 'seventeen',
									'18' => 'eighteen', '19' =>'nineteen', '20' => 'twenty',
									'30' => 'thirty', '40' => 'forty', '50' => 'fifty',
									'60' => 'sixty', '70' => 'seventy',
									'80' => 'eighty', '90' => 'ninety');
									$digits = array('', 'hundred', 'thousand', 'lakh', 'crore');
									 while ($i < $digits_1) {
										$divider = ($i == 2) ? 10 : 100;
										$number = floor($no % $divider);
										$no = floor($no / $divider);
										$i += ($divider == 10) ? 1 : 2;
										if ($number) {
											$plural = (($counter = count($str)) && $number > 9) ? 's' : null;
											$hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
											$str [] = ($number < 21) ? $words[$number] ." " . $digits[$counter] . $plural . " " . $hundred : $words[floor($number / 10) * 10]. " " . $words[$number % 10] . " ". $digits[$counter] . $plural . " " . $hundred;
										} else $str[] = null;
									}
									$str = array_reverse($str);
									$result = implode('', $str);
									$points = ($point) ? "." . $words[$point / 10] . " " . $words[$point = $point % 10] : '';
								?>
								<td colspan="4" style="padding-left:1%;"><strong>Total Amount (In Words)  :  </strong>  <?php echo ucwords($result) . "Only";  ?></td>
							</tr>
						</tbody>
					</table>
					<table width="100%">
						<tbody>
							<tr class="center">
								<td class="border-right center" style="font-size:12px;"><strong>HSN/SAC</strong></td>
								<td class="border-right center" style="font-size:12px;"><strong>Taxable Amt</strong></td>
								<td colspan="2" style="font-size:12px;" class="border-right border-bottom"><strong>Central Tax</strong></td>
								<td colspan="2" style="font-size:12px;" class="border-right border-bottom"><strong>State Tax</strong></td>
								<td colspan="2" style="font-size:12px;" class="border-right border-bottom"><strong>IGST</strong></td>
								<td colspan="2" style="font-size:12px;" class="border-right border-bottom"><strong>Cess</strong></td>
								<td class="center" style="font-size:12px;"><strong>Total Tax Amount</strong></td>
							</tr>
							<tr class="border-bottom">
								<td class="border-right"></td>
								<td class="border-right"></td>
								<td class="border-right center" style="font-size:12px;"><strong>Rate</strong></td>
								<td class="border-right center" style="font-size:12px;"><strong>Amount</strong></td>
								<td class="border-right center" style="font-size:12px;"><strong>Rate</strong></td>
								<td class="border-right center" style="font-size:12px;"><strong>Amount</strong></td>
								<td class="border-right center" style="font-size:12px;"><strong>Rate</strong></td>
								<td class="border-right center" style="font-size:12px;"><strong>Amount</strong></td>
								<td class="border-right center" style="font-size:12px;"><strong>Rate</strong></td>
								<td class="border-right center" style="font-size:12px;"><strong>Amount</strong></td>
								<td class="center"></td>
							</tr>
							<?php
								$final_total_cgst=0;
								$final_total_sgst=0;
								$final_total_igst=0;
								$final_total_cess=0;
								$final_total_taxable=0;
								$final_total_tax_amt=0;
								$res11 = mysqli_query($con,"select tbl_product.hsn_code,sum(tbl_party_transaction_detail.product_price*tbl_party_transaction_detail.quantity) as total_txn_amt,sum(tbl_party_transaction_detail.CGST_amount) as hsn_total_cgst,sum(tbl_party_transaction_detail.SGST_amount) as hsn_total_sgst,sum(tbl_party_transaction_detail.IGST_amount) as hsn_total_igst,tbl_product.CGST,tbl_product.SGST,tbl_product.IGST,tbl_party_transaction_detail.cess_pc_amt,tbl_party_transaction_detail.cess_percentage,sum(tbl_party_transaction_detail.cess_final_amt) as cesspamt,sum(tbl_party_transaction_detail.product_disc) as hsn_total_disc from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid' group by tbl_product.hsn_code");    
								while($fetch_product11=mysqli_fetch_assoc($res11))
								{
									extract($fetch_product11);
									if($hsn_code=="")
										$hsn_code="N/A";
									if($CGST_amount>0)
										$gst_inter="Yes";
									else
									if($CGST_amount==0 && $IGST_amount==0)
										$gst_inter="Yes";
									else
										$gst_inter="No";
									$final_total_cgst=$final_total_cgst+$hsn_total_cgst;
									$final_total_sgst=$final_total_sgst+$hsn_total_sgst;
									$final_total_igst=$final_total_igst+$hsn_total_igst;
									$final_total_cess=$final_total_cess+$cesspamt;
									if($dist_gst_config=="Inclusive")
										$final_total_taxable=$final_total_taxable+$total_txn_amt-$hsn_total_disc-$hsn_total_cgst-$hsn_total_sgst-$hsn_total_igst;
									else
										$final_total_taxable=$final_total_taxable+$total_txn_amt-$hsn_total_disc;
									$final_total_tax_amt=$final_total_tax_amt+$hsn_total_cgst+$hsn_total_sgst+$hsn_total_igst+$cesspamt;
								?>
									<tr class="border-bottom">
										<td class="border-right center" style="font-size:12px;"><?php echo $hsn_code; ?></td>
										<?php if($dist_gst_config=="Inclusive"){ ?>
										<td class="border-right center" style="font-size:12px;"><?php echo floor(($total_txn_amt-$hsn_total_disc-$hsn_total_cgst-$hsn_total_sgst-$hsn_total_igst)*100)/100; ?></td>
										<?php } else { ?>
										<td class="border-right center" style="font-size:12px;"><?php echo floor(($total_txn_amt-$hsn_total_disc)*100)/100; ?></td>
										<?php } if($gst_inter=="Yes") { ?>
										<td class="border-right center" style="font-size:12px;"><?php echo $CGST; ?></td>
										<td class="border-right center" style="font-size:12px;"><?php echo floor(($hsn_total_cgst)*100)/100; ?></td>
										<td class="border-right center" style="font-size:12px;"><?php echo $SGST; ?></td>
										<td class="border-right center" style="font-size:12px;"><?php echo floor(($hsn_total_sgst)*100)/100; ?></td>
										<td class="border-right center" style="font-size:12px;"><?php echo "-"; ?></td>
										<td class="border-right center" style="font-size:12px;"><?php echo "-"; ?></td>
										<?php } else { ?>
										<td class="border-right center" style="font-size:12px;"><?php echo "-"; ?></td>
										<td class="border-right center" style="font-size:12px;"><?php echo "-"; ?></td>
										<td class="border-right center" style="font-size:12px;"><?php echo "-"; ?></td>
										<td class="border-right center" style="font-size:12px;"><?php echo "-"; ?></td>
										<td class="border-right center" style="font-size:12px;"><?php echo $IGST; ?></td>
										<td class="border-right center" style="font-size:12px;"><?php echo floor(($hsn_total_igst)*100)/100; ?></td>
										<?php } ?>
										<td class="border-right center" style="font-size:12px;"><?php echo $cess_percentage."% & ".$cess_pc_amt." / PC"; ?></td>
										<td class="border-right center" style="font-size:12px;"><?php echo floor(($cesspamt)*100)/100; ?></td>
										<td class="center" style="font-size:12px;"><?php echo floor(($hsn_total_cgst+$hsn_total_sgst+$hsn_total_igst+$cesspamt)*100)/100; ?></td>
									</tr>
								<?php } ?>
									<tr class="border-bottom center">
										<td class="border-right" style="font-size:12px;"><strong>Total</strong></td>
										<td class="border-right" style="font-size:12px;"><strong><?php echo floor(($final_total_taxable)*100)/100; ?></strong></td>
										<td class="border-right" style="font-size:12px;"></td>
										<?php if($final_total_cgst>0){ ?>
										<td class="border-right" style="font-size:12px;"><strong><?php echo $final_total_cgst; ?></strong></td>
										<?php }else{ ?>
										<td class="border-right" style="font-size:12px;"><strong><?php echo "-"; ?></strong></td>
										<?php } if($final_total_sgst>0){ ?>
										<td class="border-right" style="font-size:12px;"></td>
										<td class="border-right" style="font-size:12px;"><strong><?php echo $final_total_sgst; ?></strong></td>
										<?php }else{ ?>
										<td class="border-right" style="font-size:12px;"></td>
										<td class="border-right" style="font-size:12px;"><strong><?php echo "-"; ?></strong></td>
										<?php }if($final_total_igst>0){ ?>
										<td class="border-right" style="font-size:12px;"></td>
										<td class="border-right" style="font-size:12px;"><strong><?php echo $final_total_igst; ?></strong></td>
										<?php }else{ ?>
										<td class="border-right" style="font-size:12px;"></td>
										<td class="border-right" style="font-size:12px;"><strong><?php echo "-"; ?></strong></td>
										<?php } ?>
										<td class="border-right" style="font-size:12px;"></td>
										<td class="border-right" style="font-size:12px;"><strong><?php echo floor(($final_total_cess)*100)/100; ?></strong></td>
										<td style="font-size:12px;"><strong><?php echo floor(($final_total_tax_amt)*100)/100; ?></strong></td>
									</tr>
									<tr class="border-bottom">
										<?php
											$actual_amt=floor(($final_total_tax_amt)*100)/100;
											$words_data=explode(".",$actual_amt);
											$no = $words_data[0];
											$point = $words_data[1];
											$hundred = null;
											$digits_1 = strlen($no);
											$i = 0;
											$str = array();
											$words = array('0' => '', '1' => 'one', '2' => 'two',
											'3' => 'three', '4' => 'four', '5' => 'five', '6' => 'six',
											'7' => 'seven', '8' => 'eight', '9' => 'nine',
											'10' => 'ten', '11' => 'eleven', '12' => 'twelve',
											'13' => 'thirteen', '14' => 'fourteen',
											'15' => 'fifteen', '16' => 'sixteen', '17' => 'seventeen',
											'18' => 'eighteen', '19' =>'nineteen', '20' => 'twenty',
											'30' => 'thirty', '40' => 'forty', '50' => 'fifty',
											'60' => 'sixty', '70' => 'seventy',
											'80' => 'eighty', '90' => 'ninety');
											$digits = array('', 'hundred', 'thousand', 'lakh', 'crore');
											 while ($i < $digits_1) {
												$divider = ($i == 2) ? 10 : 100;
												$number = floor($no % $divider);
												$no = floor($no / $divider);
												$i += ($divider == 10) ? 1 : 2;
												if ($number) {
													$plural = (($counter = count($str)) && $number > 9) ? 's' : null;
													$hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
													$str [] = ($number < 21) ? $words[$number] ." " . $digits[$counter] . $plural . " " . $hundred : $words[floor($number / 10) * 10]. " " . $words[$number % 10] . " ". $digits[$counter] . $plural . " " . $hundred;
												} else $str[] = null;
											}
											$str = array_reverse($str);
											$result = implode('', $str);
											$points = ($point) ? "and " . $words[$point / 10] . " " . $words[$point = $point % 10] . " Paise" : '';
										?>
										<td colspan="11"><strong>Tax Amount (In Words) : </strong> <?php echo ucwords($result).ucwords($points). " Only"; ?></td>
									</tr>
									<?php if($payment_mode1=="Cheque" || $payment_mode1=="Both"){ ?>
									<tr class="border-bottom center">
										<td class="border-right" colspan="3"><strong>Bank Name :</strong> <?php echo $bank_name1; ?></td>
										<td class="border-right" colspan="3"><strong>Cheque No :</strong> <?php echo $cheque_no1; ?></td>
										<td class="border-right" colspan="2"><strong>Cheque Amount :</strong> <?php echo $bill_cheque_amt; ?></td>
										<td colspan="3"><strong>Cheque Date :</strong> <?php echo date("d-M-Y", strtotime($cheque_date1)); ?></td>
									</tr>
									<?php } ?>
						</tbody>
					</table>
					<?php
						if($lng=='hnd'){
							$res_terms = mysqli_query($con,"select * from tbl_dist_terms_conditions_hindi where distributor_id='$ver'");
						}else{
							$res_terms = mysqli_query($con,"select * from tbl_dist_terms_conditions where distributor_id='$ver'");
						}
						$a_terms=mysqli_fetch_array($res_terms);
						$s=1;
					?>
					<table width="100%">
						<tbody>
							<tr>
								<td width="50%" style="vertical-align: top;text-align: left;">
									<div class="center-justified" style="padding-left: 5px;">
										<strong>Customer Signature :</strong><?php if($inv_sign!=''){ ?><br><br><img src="<?php echo $inv_sign; ?>" style="height: 50px;"><?php }else{ ?><pre>
											


										</pre><?php } ?><?php //echo $user_name_dis; ?><br>
										<strong>Company's PAN : <?php echo $pan_no; ?></strong><br>
										<?php if($inv_sign=''){ ?><br><br><br><br><br><br><?php } ?>
									</div>
								</td>
								<td width="50%"><strong>For <?php echo $user_name_dis; ?></strong><br><br><br><br><br><br><br></td>
							</tr>
							<p>&nbsp;</p>
							<tr>
								<td width="65%">
									<div class="center-justified" style="font-size: 10px;"><strong>Terms & Conditions </strong><br>
										E.& O.E..<br>
										<?php
											if($a_terms['terms_condition1']!=''){
												echo '1. '.$a_terms['terms_condition1'].'<br>';
											}
											if($a_terms['terms_condition2']!=''){
												echo '2. '.$a_terms['terms_condition2'].'<br>';
											}
											if($a_terms['terms_condition3']!=''){
												echo '3. '.$a_terms['terms_condition3'].'<br>';
											}

											if($a_terms['terms_condition4']!=''){
												echo '4. '.$a_terms['terms_condition4'].'<br>';
											}

											if($a_terms['terms_condition5']!=''){
												echo '5. '.$a_terms['terms_condition5'].'<br>';
											}
											if($a_terms['terms_condition6']!=''){
												echo '6. '.$a_terms['terms_condition6'].'<br>';
											}
											if($a_terms['terms_condition7']!=''){
												echo '7. '.$a_terms['terms_condition7'];
											}
										?>
									</div>
								</td>
								<td width="35%">
									<strong>Company's Bank Details :</strong><br>
									Bank Name : <?php echo $dis_bank; ?><br>
									A/C No : <?php echo $account_no; ?><br>
									Branch : <?php echo $branch; ?><br>
									IFSC Code : <?php echo $ifsc_no; ?><br>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div style="width: 100%;margin: 0 auto; margin-left: 5%; margin-right: 5%;">
					<table style="width: 700px;">
						<tbody>
							<tr>
								<td>Note : This is computer generated bill and does not require signature!</td>
								<td class="right">Powered by Bell Technology</td>
							</tr>
						</tbody>
					</table>
				</div>
				<?php
					}
				}
			}
	}
}
?>
</body>
</html>